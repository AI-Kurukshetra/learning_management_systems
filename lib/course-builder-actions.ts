"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedViewer } from "@/lib/auth";
import {
  courseModulesSchemaMismatchMessage,
  isCourseModulesSchemaMismatchError,
} from "@/lib/auth-errors";
import {
  buildTemplateModules,
  COURSE_MODULE_TYPES,
  CURRICULUM_TAGS,
  type CourseBuilderActionState,
  type CourseTemplateKey,
} from "@/lib/course-builder";
import { buildRolePath } from "@/lib/roles";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { CourseModuleItem, CourseModuleType, CurriculumTag } from "@/lib/types";

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

const MODULE_TYPE_VALUES = new Set(COURSE_MODULE_TYPES.map((option) => option.value));
const CURRICULUM_TAG_VALUES = new Set(CURRICULUM_TAGS);
const TEMPLATE_VALUES = new Set<CourseTemplateKey>(["math", "science", "custom"]);

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

function normalizeText(value: FormDataEntryValue | null, field: string) {
  const parsed = String(value ?? "").trim();

  if (!parsed) {
    throw new Error(`${field} is required.`);
  }

  return parsed;
}

function parseTemplateKey(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "custom").trim() as CourseTemplateKey;

  if (!TEMPLATE_VALUES.has(parsed)) {
    throw new Error("Invalid course template.");
  }

  return parsed;
}

function parseModuleType(value: string): CourseModuleType {
  if (!MODULE_TYPE_VALUES.has(value as CourseModuleType)) {
    throw new Error("Invalid module type.");
  }

  return value as CourseModuleType;
}

function parseCurriculumTag(value: FormDataEntryValue | null): CurriculumTag | null {
  const parsed = String(value ?? "").trim();

  if (!parsed) {
    return null;
  }

  if (!CURRICULUM_TAG_VALUES.has(parsed as CurriculumTag)) {
    throw new Error("Invalid curriculum tag.");
  }

  return parsed as CurriculumTag;
}

function mapCourseModule(row: CourseModuleRow): CourseModuleItem {
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
    tasks: [],
  };
}

function toCourseBuilderErrorMessage(error: unknown) {
  if (error instanceof Error && isCourseModulesSchemaMismatchError(error.message)) {
    return courseModulesSchemaMismatchMessage;
  }

  return error instanceof Error ? error.message : "Course builder action failed.";
}

function revalidateCourseBuilder(courseId: string) {
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}

async function assertAdminCourse(courseId: string) {
  await requireAuthenticatedViewer(["admin"]);
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id,title,teacher_id,created_at")
    .eq("id", courseId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Course not found.");
  }

  return {
    supabase,
    course: data as {
      id: string;
      title: string;
      teacher_id: string;
      created_at: string;
    },
  };
}

async function getNextPosition(courseId: string, supabase = createServiceRoleSupabaseClient()) {
  const { data, error } = await supabase
    .from("course_modules")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? Number(data.position) + 1 : 0;
}

async function applyTemplateToCourse(courseId: string, templateKey: CourseTemplateKey, supabase = createServiceRoleSupabaseClient()) {
  const templateModules = buildTemplateModules(templateKey);
  const { error } = await supabase.from("course_modules").insert(
    templateModules.map((module) => ({
      course_id: courseId,
      title: module.title,
      description: module.description,
      content: module.content,
      curriculum_tag: module.curriculumTag,
      module_type: module.moduleType,
      position: module.position,
      is_completed: false,
      completed_at: null,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAdminCourseModules(courseId: string) {
  await requireAuthenticatedViewer(["admin"]);
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("course_modules")
    .select("id,course_id,title,description,content,curriculum_tag,module_type,position,is_completed,completed_at,created_at,updated_at")
    .eq("course_id", courseId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (isCourseModulesSchemaMismatchError(error.message)) {
      throw new Error(courseModulesSchemaMismatchMessage);
    }

    throw new Error(error.message);
  }

  return ((data ?? []) as CourseModuleRow[]).map(mapCourseModule);
}

export async function createCourseWithTemplate(formData: FormData) {
  const viewer = await requireAuthenticatedViewer(["admin"]);
  const title = normalizeText(formData.get("title"), "Course title");
  const teacherId = normalizeText(formData.get("teacherId"), "Teacher");
  const redirectPath = normalizeText(formData.get("redirectPath"), "Redirect path");
  const templateKey = parseTemplateKey(formData.get("templateKey"));
  const supabase = createServiceRoleSupabaseClient();
  const schemaCheck = await supabase.from("course_modules").select("id").limit(1);

  if (schemaCheck.error && isCourseModulesSchemaMismatchError(schemaCheck.error.message)) {
    throw new Error(courseModulesSchemaMismatchMessage);
  }

  let courseId: string | null = null;

  try {
    const { data, error } = await supabase
      .from("courses")
      .insert({
        title,
        teacher_id: teacherId,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const newCourseId = data.id;
    courseId = newCourseId;
    await applyTemplateToCourse(newCourseId, templateKey, supabase);
  } catch (error) {
    if (courseId) {
      await supabase.from("courses").delete().eq("id", courseId);
    }

    throw error;
  }

  revalidatePath("/admin/courses");
  redirect(redirectPath.startsWith("/admin") ? redirectPath : buildRolePath(viewer.role, "/courses"));
}

export async function createCourseModule(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const courseId = normalizeText(formData.get("courseId"), "Course");
    const title = normalizeText(formData.get("title"), "Title");
    const description = String(formData.get("description") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const moduleType = parseModuleType(normalizeText(formData.get("moduleType"), "Module type"));
    const curriculumTag = parseCurriculumTag(formData.get("curriculumTag"));
    const { supabase } = await assertAdminCourse(courseId);
    const position = await getNextPosition(courseId, supabase);
    const { error } = await supabase.from("course_modules").insert({
      course_id: courseId,
      title,
      description,
      content,
      curriculum_tag: curriculumTag,
      module_type: moduleType,
      position,
      is_completed: false,
      completed_at: null,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidateCourseBuilder(courseId);
    return ok("Module added.");
  } catch (error) {
    return fail(toCourseBuilderErrorMessage(error));
  }
}

export async function updateCourseModule(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const courseId = normalizeText(formData.get("courseId"), "Course");
    const moduleId = normalizeText(formData.get("moduleId"), "Module");
    const title = normalizeText(formData.get("title"), "Title");
    const description = String(formData.get("description") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const moduleType = parseModuleType(normalizeText(formData.get("moduleType"), "Module type"));
    const curriculumTag = parseCurriculumTag(formData.get("curriculumTag"));
    const { supabase } = await assertAdminCourse(courseId);
    const { error } = await supabase
      .from("course_modules")
      .update({
        title,
        description,
        content,
        curriculum_tag: curriculumTag,
        module_type: moduleType,
      })
      .eq("id", moduleId)
      .eq("course_id", courseId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateCourseBuilder(courseId);
    return ok("Module updated.");
  } catch (error) {
    return fail(toCourseBuilderErrorMessage(error));
  }
}

export async function deleteCourseModule(payload: {
  courseId: string;
  moduleId: string;
}): Promise<CourseBuilderActionState> {
  try {
    const courseId = String(payload.courseId ?? "").trim();
    const moduleId = String(payload.moduleId ?? "").trim();

    if (!courseId || !moduleId) {
      throw new Error("Course and module are required.");
    }

    const { supabase } = await assertAdminCourse(courseId);
    const { data: modules, error: readError } = await supabase
      .from("course_modules")
      .select("id,position")
      .eq("course_id", courseId)
      .order("position", { ascending: true });

    if (readError) {
      throw new Error(readError.message);
    }

    const remainingModules = ((modules ?? []) as Array<{ id: string; position: number }>).filter(
      (module) => module.id !== moduleId,
    );

    const { error: deleteError } = await supabase
      .from("course_modules")
      .delete()
      .eq("id", moduleId)
      .eq("course_id", courseId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    for (const [index, module] of remainingModules.entries()) {
      const { error: reorderError } = await supabase
        .from("course_modules")
        .update({ position: index })
        .eq("id", module.id)
        .eq("course_id", courseId);

      if (reorderError) {
        throw new Error(reorderError.message);
      }
    }

    revalidateCourseBuilder(courseId);
    return ok("Module deleted.");
  } catch (error) {
    return fail(toCourseBuilderErrorMessage(error));
  }
}

export async function reorderCourseModules(payload: {
  courseId: string;
  orderedModuleIds: string[];
}): Promise<CourseBuilderActionState> {
  try {
    const courseId = String(payload.courseId ?? "").trim();
    const orderedModuleIds = Array.isArray(payload.orderedModuleIds)
      ? payload.orderedModuleIds.map((value) => String(value).trim()).filter(Boolean)
      : [];

    if (!courseId || orderedModuleIds.length === 0) {
      throw new Error("Course and ordered modules are required.");
    }

    const { supabase } = await assertAdminCourse(courseId);
    const { data: existingModules, error: existingError } = await supabase
      .from("course_modules")
      .select("id")
      .eq("course_id", courseId);

    if (existingError) {
      throw new Error(existingError.message);
    }

    const existingIds = new Set(((existingModules ?? []) as Array<{ id: string }>).map((module) => module.id));

    if (existingIds.size !== orderedModuleIds.length || orderedModuleIds.some((id) => !existingIds.has(id))) {
      throw new Error("Module order payload is invalid.");
    }

    for (const [index, moduleId] of orderedModuleIds.entries()) {
      const { error } = await supabase
        .from("course_modules")
        .update({ position: index })
        .eq("id", moduleId)
        .eq("course_id", courseId);

      if (error) {
        throw new Error(error.message);
      }
    }

    revalidateCourseBuilder(courseId);
    return ok("Module order updated.");
  } catch (error) {
    return fail(toCourseBuilderErrorMessage(error));
  }
}

export async function applyCourseTemplate(payload: {
  courseId: string;
  templateKey: CourseTemplateKey;
}): Promise<CourseBuilderActionState> {
  try {
    const courseId = String(payload.courseId ?? "").trim();
    const templateKey = String(payload.templateKey ?? "").trim() as CourseTemplateKey;

    if (!courseId) {
      throw new Error("Course is required.");
    }

    if (!TEMPLATE_VALUES.has(templateKey)) {
      throw new Error("Invalid course template.");
    }

    const { supabase } = await assertAdminCourse(courseId);
    const { error: deleteError } = await supabase.from("course_modules").delete().eq("course_id", courseId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await applyTemplateToCourse(courseId, templateKey, supabase);

    revalidateCourseBuilder(courseId);
    return ok("Template applied.");
  } catch (error) {
    return fail(toCourseBuilderErrorMessage(error));
  }
}



