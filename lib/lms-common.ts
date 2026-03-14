import { revalidatePath } from "next/cache";
import { requireAuthenticatedViewer } from "@/lib/auth";
import {
  courseModulesSchemaMismatchMessage,
  isCourseModulesSchemaMismatchError,
} from "@/lib/auth-errors";
import type { CourseBuilderActionState } from "@/lib/course-builder";
import { buildRolePath } from "@/lib/roles";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { AppUser, UserRole, Viewer } from "@/lib/types";

export interface CourseRow {
  id: string;
  title: string;
  teacher_id: string;
}

export function ok(message: string): CourseBuilderActionState {
  return { success: true, error: null, message };
}

export function fail(message: string): CourseBuilderActionState {
  return { success: false, error: message, message: null };
}

export function toSchemaAwareMessage(error: unknown) {
  if (error instanceof Error && isCourseModulesSchemaMismatchError(error.message)) {
    return courseModulesSchemaMismatchMessage;
  }

  return error instanceof Error ? error.message : "Action failed.";
}

export function normalizeText(value: FormDataEntryValue | null, field: string) {
  const parsed = String(value ?? "").trim();

  if (!parsed) {
    throw new Error(`${field} is required.`);
  }

  return parsed;
}

export function optionalText(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed || null;
}

export function normalizeValue(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function sanitizeStorageSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function getUserMap(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return new Map<string, AppUser>();
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,auth_user_id,email,name,role,created_at")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as AppUser[]).map((user) => [user.id, user]));
}

export async function getAccessibleCourses(viewer: Viewer, courseId?: string) {
  const supabase = createServiceRoleSupabaseClient();

  if (viewer.role === "admin") {
    let query = supabase.from("courses").select("id,title,teacher_id").order("title", { ascending: true });
    if (courseId) query = query.eq("id", courseId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as CourseRow[];
  }

  if (viewer.role === "teacher") {
    let query = supabase.from("courses").select("id,title,teacher_id").eq("teacher_id", viewer.currentUser.id).order("title", { ascending: true });
    if (courseId) query = query.eq("id", courseId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as CourseRow[];
  }

  let enrollmentQuery = supabase.from("enrollments").select("course_id").eq("student_id", viewer.currentUser.id);
  if (courseId) enrollmentQuery = enrollmentQuery.eq("course_id", courseId);
  const { data: enrollments, error: enrollmentError } = await enrollmentQuery;
  if (enrollmentError) throw new Error(enrollmentError.message);
  const courseIds = [...new Set((enrollments ?? []).map((row: { course_id: string }) => row.course_id))];
  if (courseIds.length === 0) return [];
  const { data, error } = await supabase.from("courses").select("id,title,teacher_id").in("id", courseIds).order("title", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CourseRow[];
}

export async function assertCourseAccess(courseId: string, roles?: UserRole[]) {
  const viewer = await requireAuthenticatedViewer(roles);
  const courses = await getAccessibleCourses(viewer, courseId);
  const course = courses[0];

  if (!course) {
    throw new Error("Course not found or inaccessible.");
  }

  return { viewer, supabase: createServiceRoleSupabaseClient(), course };
}

export async function getEnrollmentUserIds(courseId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.from("enrollments").select("student_id").eq("course_id", courseId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: { student_id: string }) => row.student_id);
}

export async function getAdminUserIds() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.from("users").select("id").eq("role", "admin");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: { id: string }) => row.id);
}

export function revalidateWorkspace(role: UserRole) {
  revalidatePath(`/${role}/dashboard`);
  revalidatePath(`/${role}/calendar`);
  revalidatePath(`/${role}/attendance`);
  revalidatePath(`/${role}/quizzes`);
  revalidatePath(`/${role}/files`);
  revalidatePath(`/${role}/resources`);
  revalidatePath(`/${role}/messages`);
}

export function revalidateCourseMembers(courseId: string) {
  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath("/teacher/courses");
  revalidatePath("/student/courses");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/student/dashboard");
}

export function buildMessageLink(role: UserRole, userId: string) {
  return buildRolePath(role, `/messages?with=${userId}`);
}