"use server";

import { randomUUID } from "node:crypto";
import { requireAuthenticatedViewer } from "@/lib/auth";
import type { CourseBuilderActionState } from "@/lib/course-builder";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import {
  assertCourseAccess,
  fail,
  getAccessibleCourses,
  getUserMap,
  normalizeText,
  ok,
  optionalText,
  revalidateCourseMembers,
  revalidateWorkspace,
  sanitizeStorageSegment,
  toSchemaAwareMessage,
  type CourseRow,
} from "@/lib/lms-common";
import type { FileCategory, FileItem, FileCategory as FileCategoryType, UserRole } from "@/lib/types";

interface FileRow {
  id: string;
  course_id: string | null;
  assignment_id: string | null;
  uploader_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  category: FileCategoryType;
  storage_path: string;
  created_at: string;
}

function mapFile(row: FileRow, courses: Map<string, CourseRow>, uploaders: Map<string, { name: string; role: UserRole }>): FileItem {
  const course = row.course_id ? courses.get(row.course_id) : null;
  const uploader = uploaders.get(row.uploader_id);
  return {
    id: row.id,
    courseId: row.course_id,
    courseTitle: course?.title ?? "General file",
    assignmentId: row.assignment_id,
    uploaderId: row.uploader_id,
    uploaderName: uploader?.name ?? "Unknown user",
    uploaderRole: uploader?.role ?? "student",
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileType: row.file_type,
    category: row.category,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  };
}

export async function uploadFile(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const viewer = await requireAuthenticatedViewer();
    const courseId = optionalText(formData.get("courseId"));
    const assignmentId = optionalText(formData.get("assignmentId"));
    const category = normalizeText(formData.get("category"), "Category") as FileCategory;
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      throw new Error("Select a file to upload.");
    }

    if (!["resource", "assignment_attachment", "submission"].includes(category)) {
      throw new Error("Invalid file category.");
    }

    if (courseId) {
      await assertCourseAccess(courseId);
    }

    if ((category === "resource" || category === "assignment_attachment") && viewer.role === "student") {
      throw new Error("Students can only upload submission files.");
    }

    const supabase = createServiceRoleSupabaseClient();
    const safeName = sanitizeStorageSegment(file.name);
    const extension = safeName.includes(".") ? safeName.split(".").pop() : "bin";
    const storagePath = `${courseId ?? "general"}/${category}/${viewer.currentUser.id}/${randomUUID()}.${extension}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await supabase.storage.from("course-files").upload(storagePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadResult.error) throw new Error(uploadResult.error.message);

    const publicUrl = supabase.storage.from("course-files").getPublicUrl(storagePath).data.publicUrl;
    const { error } = await supabase.from("files").insert({
      course_id: courseId,
      assignment_id: assignmentId,
      uploader_id: viewer.currentUser.id,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type || "application/octet-stream",
      category,
      storage_path: storagePath,
    });
    if (error) throw new Error(error.message);

    revalidateWorkspace(viewer.role);
    if (courseId) revalidateCourseMembers(courseId);
    return ok("File uploaded.");
  } catch (error) {
    return fail(toSchemaAwareMessage(error));
  }
}

export async function getCourseFiles({ courseId, assignmentId, category }: { courseId?: string; assignmentId?: string; category?: FileCategory } = {}) {
  const viewer = await requireAuthenticatedViewer();
  const supabase = createServiceRoleSupabaseClient();
  const courses = await getAccessibleCourses(viewer, courseId);
  const courseIds = courses.map((course) => course.id);
  if (courseId && courseIds.length === 0) return [] as FileItem[];

  let query = supabase
    .from("files")
    .select("id,course_id,assignment_id,uploader_id,file_name,file_url,file_type,category,storage_path,created_at")
    .order("created_at", { ascending: false });
  if (courseId) query = query.eq("course_id", courseId);
  else if (courseIds.length > 0) query = query.in("course_id", courseIds);
  if (assignmentId) query = query.eq("assignment_id", assignmentId);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return [] as FileItem[];

  const rows = (data ?? []) as FileRow[];
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const userMap = await getUserMap(rows.map((row) => row.uploader_id));
  const simpleUserMap = new Map(Array.from(userMap.values()).map((user) => [user.id, { name: user.name, role: user.role }]));
  return rows.map((row) => mapFile(row, courseMap, simpleUserMap));
}

export async function deleteFile(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const viewer = await requireAuthenticatedViewer();
    const fileId = normalizeText(formData.get("fileId"), "File");
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("files")
      .select("id,course_id,assignment_id,uploader_id,file_name,file_url,file_type,category,storage_path,created_at")
      .eq("id", fileId)
      .maybeSingle();
    if (error || !data) throw new Error(error?.message ?? "File not found.");

    const row = data as FileRow;
    let allowed = viewer.role === "admin" || row.uploader_id === viewer.currentUser.id;
    if (!allowed && row.course_id) {
      const courses = await getAccessibleCourses(viewer, row.course_id);
      allowed = viewer.role === "teacher" && courses.length > 0;
    }
    if (!allowed) throw new Error("You cannot delete this file.");

    const storageError = await supabase.storage.from("course-files").remove([row.storage_path]);
    if (storageError.error) throw new Error(storageError.error.message);
    const { error: deleteError } = await supabase.from("files").delete().eq("id", fileId);
    if (deleteError) throw new Error(deleteError.message);

    revalidateWorkspace(viewer.role);
    if (row.course_id) revalidateCourseMembers(row.course_id);
    return ok("File deleted.");
  } catch (error) {
    return fail(toSchemaAwareMessage(error));
  }
}