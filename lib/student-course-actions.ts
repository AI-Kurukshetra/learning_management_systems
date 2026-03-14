"use server";

import { requireAuthenticatedViewer } from "@/lib/auth";
import {
  courseModulesSchemaMismatchMessage,
  isCourseModulesSchemaMismatchError,
} from "@/lib/auth-errors";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type {
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

async function assertStudentCourse(courseId: string) {
  const viewer = await requireAuthenticatedViewer(["student"]);
  const supabase = createServiceRoleSupabaseClient();
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

export async function getStudentCourseModules(courseId: string) {
  const { supabase } = await assertStudentCourse(courseId);
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
    const taskList = tasksByModule.get(row.module_id) ?? [];
    taskList.push(mapTask(row));
    tasksByModule.set(row.module_id, taskList);
  });

  return modules.map((module) => mapModule(module, tasksByModule.get(module.id) ?? []));
}

export async function getStudentCourseGrade(courseId: string) {
  const { viewer, supabase } = await assertStudentCourse(courseId);
  const { data, error } = await supabase
    .from("course_grades")
    .select("id,course_id,student_id,grade,comments,updated_at")
    .eq("course_id", courseId)
    .eq("student_id", viewer.currentUser.id)
    .maybeSingle();

  if (error) {
    if (isCourseModulesSchemaMismatchError(error.message)) {
      throw new Error(courseModulesSchemaMismatchMessage);
    }

    throw new Error(error.message);
  }

  return data ? mapGrade(data as CourseGradeRow) : null;
}
