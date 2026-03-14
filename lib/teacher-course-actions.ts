"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedViewer } from "@/lib/auth";
import {
  courseModulesSchemaMismatchMessage,
  isCourseModulesSchemaMismatchError,
} from "@/lib/auth-errors";
import type { CourseBuilderActionState } from "@/lib/course-builder";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { parseDateInputToIso } from "@/lib/date-format";
import type {
  AppUser,
  CourseModuleItem,
  CourseModuleTaskItem,
  CourseModuleType,
  CourseStudentGradeItem,
  CurriculumTag,
} from "@/lib/types";

interface CourseModuleRow {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  curriculum_tag: CurriculumTag | null;
  module_type: CourseModuleType;
  position: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CourseModuleTaskRow {
  id: string;
  module_id: string;
  title: string;
  due_date: string | null;
  is_completed: boolean;
  position: number;
  created_at: string;
}

interface CourseGradeRow {
  id: string;
  course_id: string;
  student_id: string;
  grade: number | null;
  comments: string | null;
  updated_at: string;
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

  return error instanceof Error ? error.message : "Lesson action failed.";
}

function normalizeText(value: FormDataEntryValue | null, field: string) {
  const parsed = String(value ?? "").trim();

  if (!parsed) {
    throw new Error(`${field} is required.`);
  }

  return parsed;
}

function mapTask(row: CourseModuleTaskRow): CourseModuleTaskItem {
  return {
    id: row.id,
    moduleId: row.module_id,
    title: row.title,
    dueDate: row.due_date,
    isCompleted: row.is_completed,
    position: row.position,
    createdAt: row.created_at,
  };
}

function mapModule(row: CourseModuleRow, tasks: CourseModuleTaskItem[]): CourseModuleItem {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description,
    content: row.content,
    curriculumTag: row.curriculum_tag,
    moduleType: row.module_type,
    position: row.position,
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tasks,
  };
}

function mapGrade(row: CourseGradeRow): CourseStudentGradeItem {
  return {
    id: row.id,
    courseId: row.course_id,
    studentId: row.student_id,
    grade: row.grade,
    comments: row.comments,
    updatedAt: row.updated_at,
  };
}

async function assertTeacherCourse(courseId: string) {
  const viewer = await requireAuthenticatedViewer(["teacher"]);
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id,teacher_id")
    .eq("id", courseId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.teacher_id !== viewer.currentUser.id) {
    throw new Error("You can only manage your own courses.");
  }

  return { viewer, supabase };
}

async function assertTeacherLessonModule(courseId: string, moduleId: string) {
  const { viewer, supabase } = await assertTeacherCourse(courseId);
  const { data, error } = await supabase
    .from("course_modules")
    .select("id,course_id,module_type,is_completed")
    .eq("id", moduleId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Lesson module not found.");
  }

  if (data.module_type !== "lesson") {
    throw new Error("Tasks can only be added to lesson modules.");
  }

  return {
    viewer,
    supabase,
    module: data as { id: string; course_id: string; module_type: CourseModuleType; is_completed: boolean },
  };
}

async function assertTeacherStudentEnrollment(courseId: string, studentId: string) {
  const { supabase } = await assertTeacherCourse(courseId);
  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Student is not enrolled in this course.");
  }

  return { supabase };
}

function revalidateTeacherCourse(courseId: string) {
  revalidatePath("/teacher/dashboard");
  revalidatePath("/teacher/courses");
  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath("/student/dashboard");
  revalidatePath("/student/courses");
  revalidatePath(`/student/courses/${courseId}`);
}

export async function getTeacherCourseModules(courseId: string) {
  const { supabase } = await assertTeacherCourse(courseId);
  const { data: moduleRows, error: moduleError } = await supabase
    .from("course_modules")
    .select("id,course_id,title,description,content,curriculum_tag,module_type,position,is_completed,completed_at,created_at,updated_at")
    .eq("course_id", courseId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (moduleError) {
    if (isCourseModulesSchemaMismatchError(moduleError.message)) {
      throw new Error(courseModulesSchemaMismatchMessage);
    }

    throw new Error(moduleError.message);
  }

  const modules = (moduleRows ?? []) as CourseModuleRow[];
  const moduleIds = modules.map((module) => module.id);

  const taskResult =
    moduleIds.length > 0
      ? await supabase
          .from("course_module_tasks")
          .select("id,module_id,title,due_date,is_completed,position,created_at")
          .in("module_id", moduleIds)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true })
      : { data: [], error: null };

  if (taskResult.error) {
    if (isCourseModulesSchemaMismatchError(taskResult.error.message)) {
      throw new Error(courseModulesSchemaMismatchMessage);
    }

    throw new Error(taskResult.error.message);
  }

  const tasksByModule = new Map<string, CourseModuleTaskItem[]>();

  ((taskResult.data ?? []) as CourseModuleTaskRow[]).forEach((row) => {
    const nextTask = mapTask(row);
    const taskList = tasksByModule.get(row.module_id) ?? [];
    taskList.push(nextTask);
    tasksByModule.set(row.module_id, taskList);
  });

  return modules.map((module) => mapModule(module, tasksByModule.get(module.id) ?? []));
}

export async function getTeacherCourseGrades(courseId: string) {
  const { supabase } = await assertTeacherCourse(courseId);
  const { data, error } = await supabase
    .from("course_grades")
    .select("id,course_id,student_id,grade,comments,updated_at")
    .eq("course_id", courseId);

  if (error) {
    if (isCourseModulesSchemaMismatchError(error.message)) {
      throw new Error(courseModulesSchemaMismatchMessage);
    }

    throw new Error(error.message);
  }

  return ((data ?? []) as CourseGradeRow[]).map(mapGrade);
}

export async function addLessonTask(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const courseId = normalizeText(formData.get("courseId"), "Course");
    const moduleId = normalizeText(formData.get("moduleId"), "Lesson");
    const title = normalizeText(formData.get("title"), "Task title");
    const dueDateInput = String(formData.get("dueDate") ?? "").trim();
    const dueDate = parseDateInputToIso(dueDateInput);
    const { supabase } = await assertTeacherLessonModule(courseId, moduleId);
    const { data: existingTask, error: taskReadError } = await supabase
      .from("course_module_tasks")
      .select("position")
      .eq("module_id", moduleId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (taskReadError) {
      throw new Error(taskReadError.message);
    }

    const nextPosition = existingTask ? Number(existingTask.position) + 1 : 0;
    const { error } = await supabase.from("course_module_tasks").insert({
      module_id: moduleId,
      title,
      due_date: dueDate,
      position: nextPosition,
      is_completed: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidateTeacherCourse(courseId);
    return ok("Lesson task added.");
  } catch (error) {
    return fail(toSchemaAwareMessage(error));
  }
}

export async function toggleLessonCompletion(payload: {
  courseId: string;
  moduleId: string;
}): Promise<CourseBuilderActionState> {
  try {
    const courseId = String(payload.courseId ?? "").trim();
    const moduleId = String(payload.moduleId ?? "").trim();

    if (!courseId || !moduleId) {
      throw new Error("Course and lesson are required.");
    }

    const { supabase, module } = await assertTeacherLessonModule(courseId, moduleId);
    const nextCompletedState = !module.is_completed;
    const { error } = await supabase
      .from("course_modules")
      .update({
        is_completed: nextCompletedState,
        completed_at: nextCompletedState ? new Date().toISOString() : null,
      })
      .eq("id", moduleId)
      .eq("course_id", courseId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateTeacherCourse(courseId);
    return ok(nextCompletedState ? "Lesson marked complete." : "Lesson reopened.");
  } catch (error) {
    return fail(toSchemaAwareMessage(error));
  }
}

export async function saveCourseGrade(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const courseId = normalizeText(formData.get("courseId"), "Course");
    const studentId = normalizeText(formData.get("studentId"), "Student");
    const gradeValue = String(formData.get("grade") ?? "").trim();
    const comments = String(formData.get("comments") ?? "").trim() || null;
    const grade = gradeValue ? Number(gradeValue) : null;

    if (grade !== null && Number.isNaN(grade)) {
      throw new Error("Grade must be a number.");
    }

    const { supabase } = await assertTeacherStudentEnrollment(courseId, studentId);
    const { error } = await supabase.from("course_grades").upsert(
      {
        course_id: courseId,
        student_id: studentId,
        grade,
        comments,
      },
      {
        onConflict: "course_id,student_id",
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    revalidateTeacherCourse(courseId);
    return ok("Course grade saved.");
  } catch (error) {
    return fail(toSchemaAwareMessage(error));
  }
}

