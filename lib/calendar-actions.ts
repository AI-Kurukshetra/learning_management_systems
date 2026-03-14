"use server";

import { requireAuthenticatedViewer } from "@/lib/auth";
import type { CourseBuilderActionState } from "@/lib/course-builder";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import {
  assertCourseAccess,
  fail,
  getAccessibleCourses,
  getEnrollmentUserIds,
  normalizeText,
  ok,
  optionalText,
  revalidateCourseMembers,
  revalidateWorkspace,
  toSchemaAwareMessage,
  type CourseRow,
} from "@/lib/lms-common";
import { createNotifications } from "@/lib/notification-actions";
import type { CalendarEventItem, CalendarEventType } from "@/lib/types";

interface CalendarEventRow {
  id: string;
  course_id: string;
  created_by: string | null;
  event_type: CalendarEventType;
  title: string;
  description: string;
  scheduled_at: string;
  created_at: string;
}

function mapCalendarEvent(row: CalendarEventRow, courses: Map<string, CourseRow>): CalendarEventItem {
  const course = courses.get(row.course_id);

  return {
    id: row.id,
    courseId: row.course_id,
    courseTitle: course?.title ?? "Unknown course",
    eventType: row.event_type,
    title: row.title,
    description: row.description,
    scheduledAt: row.scheduled_at,
    createdById: row.created_by,
    createdAt: row.created_at,
  };
}

export async function getCalendarEvents({ courseId }: { courseId?: string } = {}) {
  const viewer = await requireAuthenticatedViewer();
  const supabase = createServiceRoleSupabaseClient();
  const courses = await getAccessibleCourses(viewer, courseId);

  if (courses.length === 0) {
    return [] as CalendarEventItem[];
  }

  const courseIds = courses.map((course) => course.id);
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const [eventResult, assignmentResult] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id,course_id,created_by,event_type,title,description,scheduled_at,created_at")
      .in("course_id", courseIds)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("assignments")
      .select("id,course_id,title,description,due_date,created_at")
      .in("course_id", courseIds)
      .order("due_date", { ascending: true }),
  ]);

  if (eventResult.error || assignmentResult.error) {
    return [] as CalendarEventItem[];
  }

  const scheduleEvents = ((eventResult.data ?? []) as CalendarEventRow[]).map((row) => mapCalendarEvent(row, courseMap));
  const assignmentEvents = (assignmentResult.data ?? []).map(
    (row: { id: string; course_id: string; title: string; description: string; due_date: string; created_at: string }) => ({
      id: row.id,
      courseId: row.course_id,
      courseTitle: courseMap.get(row.course_id)?.title ?? "Unknown course",
      eventType: "assignment" as CalendarEventType,
      title: row.title,
      description: row.description,
      scheduledAt: row.due_date,
      createdById: courseMap.get(row.course_id)?.teacher_id ?? null,
      createdAt: row.created_at,
    }),
  );

  return [...scheduleEvents, ...assignmentEvents].sort(
    (left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
  );
}

export async function createCalendarEvent(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const courseId = normalizeText(formData.get("courseId"), "Course");
    const { viewer, supabase, course } = await assertCourseAccess(courseId, ["admin", "teacher"]);
    const eventType = normalizeText(formData.get("eventType"), "Event type") as CalendarEventType;
    const title = normalizeText(formData.get("title"), "Title");
    const description = optionalText(formData.get("description")) ?? "";
    const scheduledAt = normalizeText(formData.get("scheduledAt"), "Scheduled date");

    if (!["assignment", "event", "exam"].includes(eventType)) {
      throw new Error("Invalid event type.");
    }

    const { error } = await supabase.from("calendar_events").insert({
      course_id: course.id,
      created_by: viewer.currentUser.id,
      event_type: eventType,
      title,
      description,
      scheduled_at: new Date(scheduledAt).toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }

    const studentIds = await getEnrollmentUserIds(course.id);
    await createNotifications(
      studentIds.map((studentId) => ({
        userId: studentId,
        type: "course_enrollment",
        title: `${course.title} updated`,
        body: `${eventType} scheduled: ${title}`,
        link: "/student/calendar",
      })),
    );

    revalidateWorkspace(viewer.role);
    revalidateCourseMembers(course.id);
    return ok("Calendar event scheduled.");
  } catch (error) {
    return fail(toSchemaAwareMessage(error));
  }
}