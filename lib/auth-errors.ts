export const authSchemaMismatchMessage =
  "Supabase users table is outdated. Run supabase/eduflow-schema.sql in the Supabase SQL Editor, then try again.";

export const courseModulesSchemaMismatchMessage =
  "Supabase course workflow tables are outdated. Run supabase/eduflow-schema.sql in the Supabase SQL Editor, then reopen this course.";

export function isAuthSessionMissingError(message?: string) {
  return message === "Auth session missing!";
}

export function isAuthSchemaMismatchError(message?: string) {
  if (!message) {
    return false;
  }

  return (
    message.includes("users.auth_user_id") ||
    message.includes("users.email") ||
    message.includes("auth_user_id") ||
    message.includes("email")
  );
}

export function isCourseModulesSchemaMismatchError(message?: string) {
  if (!message) {
    return false;
  }

  return (
    message.includes("public.course_modules") ||
    (message.includes("course_modules") && message.includes("schema cache")) ||
    message.includes('relation "public.course_modules" does not exist') ||
    message.includes('relation "course_modules" does not exist') ||
    message.includes('relation "public.course_module_tasks" does not exist') ||
    message.includes('relation "course_module_tasks" does not exist') ||
    message.includes('relation "public.course_grades" does not exist') ||
    message.includes('relation "course_grades" does not exist') ||
    message.includes('relation "public.course_messages" does not exist') ||
    message.includes('relation "course_messages" does not exist') ||
    message.includes("course_modules.is_completed") ||
    message.includes("course_modules.completed_at") ||
    message.includes("course_module_tasks") ||
    message.includes("course_grades") ||
    message.includes("course_messages")
  );
}