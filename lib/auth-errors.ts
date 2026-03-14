export const authSchemaMismatchMessage =
  "Supabase users table is outdated. Run supabase/eduflow-schema.sql in the Supabase SQL Editor, then try again.";

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
