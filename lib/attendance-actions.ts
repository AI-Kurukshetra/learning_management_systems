"use server";

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
  revalidateWorkspace,
  toSchemaAwareMessage,
  type CourseRow,
} from "@/lib/lms-common";
import type { AttendanceRecordItem, AttendanceStatus, AttendanceSummaryItem, AppUser } from "@/lib/types";

interface AttendanceRow {
  id: string;
  course_id: string;
  student_id: string;
  session_date: string;
  status: AttendanceStatus;
  marked_by: string | null;
  notes: string | null;
  created_at: string;
}

function mapAttendanceRow(row: AttendanceRow, courses: Map<string, CourseRow>, students: Map<string, AppUser>): AttendanceRecordItem {
  const course = courses.get(row.course_id);
  const student = students.get(row.student_id);

  return {
    id: row.id,
    courseId: row.course_id,
    courseTitle: course?.title ?? "Unknown course",
    studentId: row.student_id,
    studentName: student?.name ?? "Unknown student",
    studentEmail: student?.email ?? "",
    sessionDate: row.session_date,
    status: row.status,
    markedById: row.marked_by,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function getAttendance({ courseId, sessionDate }: { courseId?: string; sessionDate?: string } = {}) {
  const viewer = await requireAuthenticatedViewer(["admin", "teacher"]);
  const supabase = createServiceRoleSupabaseClient();
  const courses = await getAccessibleCourses(viewer, courseId);
  const selectedCourse = courses[0] ?? null;
  const selectedDate = sessionDate ?? new Date().toISOString().slice(0, 10);

  if (!selectedCourse) {
    return { courses: [], selectedCourseId: null, selectedDate, students: [] as AppUser[], records: [] as AttendanceRecordItem[], summaries: [] as AttendanceSummaryItem[] };
  }

  const enrollmentResult = await supabase.from("enrollments").select("student_id").eq("course_id", selectedCourse.id);
  if (enrollmentResult.error) throw new Error(enrollmentResult.error.message);
  const studentIds = (enrollmentResult.data ?? []).map((row: { student_id: string }) => row.student_id);
  const studentMap = await getUserMap(studentIds);

  const recordResult = await supabase
    .from("attendance")
    .select("id,course_id,student_id,session_date,status,marked_by,notes,created_at")
    .eq("course_id", selectedCourse.id)
    .eq("session_date", selectedDate)
    .order("created_at", { ascending: true });
  if (recordResult.error) return { courses, selectedCourseId: selectedCourse.id, selectedDate, students: Array.from(studentMap.values()), records: [] as AttendanceRecordItem[], summaries: [] as AttendanceSummaryItem[] };

  const summaryResult = await supabase
    .from("attendance")
    .select("course_id,status")
    .in("course_id", courses.map((course) => course.id));
  if (summaryResult.error) throw new Error(summaryResult.error.message);

  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const records = ((recordResult.data ?? []) as AttendanceRow[]).map((row) => mapAttendanceRow(row, courseMap, studentMap));
  const summaries = courses.map<AttendanceSummaryItem>((course) => {
    const rows = (summaryResult.data ?? []).filter((row: { course_id: string }) => row.course_id === course.id);
    return {
      courseId: course.id,
      courseTitle: course.title,
      present: rows.filter((row: { status: AttendanceStatus }) => row.status === "present").length,
      absent: rows.filter((row: { status: AttendanceStatus }) => row.status === "absent").length,
      late: rows.filter((row: { status: AttendanceStatus }) => row.status === "late").length,
      total: rows.length,
    };
  });

  return {
    courses,
    selectedCourseId: selectedCourse.id,
    selectedDate,
    students: Array.from(studentMap.values()).sort((left, right) => left.name.localeCompare(right.name)),
    records,
    summaries,
  };
}

export async function getAttendanceReport() {
  const { summaries } = await getAttendance();
  return summaries;
}

export async function markAttendance(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const courseId = normalizeText(formData.get("courseId"), "Course");
    const sessionDate = normalizeText(formData.get("sessionDate"), "Session date");
    const { viewer, supabase } = await assertCourseAccess(courseId, ["admin", "teacher"]);
    const studentIds = formData.getAll("studentIds").map((value) => String(value).trim()).filter(Boolean);

    const rows = studentIds.map((studentId) => {
      const status = normalizeText(formData.get(`status_${studentId}`), "Attendance status") as AttendanceStatus;
      const notes = optionalText(formData.get(`notes_${studentId}`));
      if (!["present", "absent", "late"].includes(status)) {
        throw new Error("Invalid attendance status.");
      }
      return {
        course_id: courseId,
        student_id: studentId,
        session_date: sessionDate,
        status,
        marked_by: viewer.currentUser.id,
        notes,
      };
    });

    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "course_id,student_id,session_date" });
    if (error) throw new Error(error.message);

    revalidateWorkspace(viewer.role);
    return ok("Attendance saved.");
  } catch (error) {
    return fail(toSchemaAwareMessage(error));
  }
}