"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedViewer } from "@/lib/auth";
import {
  courseModulesSchemaMismatchMessage,
  isCourseModulesSchemaMismatchError,
} from "@/lib/auth-errors";
import type { CourseBuilderActionState } from "@/lib/course-builder";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { AppUser, CourseForumMessageItem, UserRole } from "@/lib/types";

interface CourseMessageRow {
  id: string;
  course_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

function ok(message: string): CourseBuilderActionState {
  return {
    success: true,
    error: null,
    message,
  };
}

function fail(message: string): CourseBuilderActionState {
  return {
    success: false,
    error: message,
    message: null,
  };
}

function toSchemaAwareMessage(error: unknown) {
  if (error instanceof Error && isCourseModulesSchemaMismatchError(error.message)) {
    return courseModulesSchemaMismatchMessage;
  }

  return error instanceof Error ? error.message : "Course discussion action failed.";
}

function normalizeText(value: FormDataEntryValue | null, field: string) {
  const parsed = String(value ?? "").trim();

  if (!parsed) {
    throw new Error(`${field} is required.`);
  }

  return parsed;
}

async function assertCourseDiscussionAccess(courseId: string) {
  const viewer = await requireAuthenticatedViewer(["teacher", "student"]);
  const supabase = createServiceRoleSupabaseClient();

  if (viewer.role === "teacher") {
    const { data, error } = await supabase
      .from("courses")
      .select("id,teacher_id")
      .eq("id", courseId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.teacher_id !== viewer.currentUser.id) {
      throw new Error("You can only access discussions for your own courses.");
    }

    return { viewer, supabase };
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("student_id", viewer.currentUser.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("You are not enrolled in this course.");
  }

  return { viewer, supabase };
}

function mapMessage(row: CourseMessageRow, sender: AppUser | undefined): CourseForumMessageItem {
  return {
    id: row.id,
    courseId: row.course_id,
    senderId: row.sender_id,
    senderName: sender?.name ?? "Unknown user",
    senderEmail: sender?.email ?? "",
    senderRole: (sender?.role ?? "student") as UserRole,
    body: row.body,
    createdAt: row.created_at,
  };
}

function revalidateCourseDiscussion(courseId: string) {
  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath("/teacher/dashboard");
  revalidatePath("/student/dashboard");
}

export async function getCourseForumMessages(courseId: string) {
  const { supabase } = await assertCourseDiscussionAccess(courseId);
  const { data, error } = await supabase
    .from("course_messages")
    .select("id,course_id,sender_id,body,created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isCourseModulesSchemaMismatchError(error.message)) {
      throw new Error(courseModulesSchemaMismatchMessage);
    }

    throw new Error(error.message);
  }

  const messageRows = (data ?? []) as CourseMessageRow[];
  const senderIds = [...new Set(messageRows.map((message) => message.sender_id))];
  const userResult =
    senderIds.length > 0
      ? await supabase
          .from("users")
          .select("id,auth_user_id,email,name,role,created_at")
          .in("id", senderIds)
      : { data: [], error: null };

  if (userResult.error) {
    throw new Error(userResult.error.message);
  }

  const userMap = new Map(((userResult.data ?? []) as AppUser[]).map((user) => [user.id, user]));

  return messageRows.map((message) => mapMessage(message, userMap.get(message.sender_id)));
}

export async function postCourseMessage(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const courseId = normalizeText(formData.get("courseId"), "Course");
    const body = normalizeText(formData.get("body"), "Message");
    const { viewer, supabase } = await assertCourseDiscussionAccess(courseId);
    const { error } = await supabase.from("course_messages").insert({
      course_id: courseId,
      sender_id: viewer.currentUser.id,
      body,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidateCourseDiscussion(courseId);
    return ok("Message sent.");
  } catch (error) {
    return fail(toSchemaAwareMessage(error));
  }
}