import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { authSchemaMismatchMessage, isAuthSchemaMismatchError, isAuthSessionMissingError } from "@/lib/auth-errors";
import { getDashboardPath } from "@/lib/roles";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { AppUser, UserRole, Viewer } from "@/lib/types";

async function getProfileForAuthUser(user: User) {
  const adminSupabase = createServiceRoleSupabaseClient();
  const email = user.email?.toLowerCase() ?? null;

  const { data: linkedProfile, error: linkedProfileError } = await adminSupabase
    .from("users")
    .select("id,auth_user_id,email,name,role,created_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (linkedProfileError) {
    if (isAuthSchemaMismatchError(linkedProfileError.message)) {
      return null;
    }

    throw new Error(linkedProfileError.message);
  }

  if (linkedProfile) {
    return linkedProfile as AppUser;
  }

  if (!email) {
    return null;
  }

  const { data: emailProfile, error: emailProfileError } = await adminSupabase
    .from("users")
    .select("id,auth_user_id,email,name,role,created_at")
    .eq("email", email)
    .maybeSingle();

  if (emailProfileError) {
    if (isAuthSchemaMismatchError(emailProfileError.message)) {
      return null;
    }

    throw new Error(emailProfileError.message);
  }

  if (!emailProfile) {
    return null;
  }

  const { data: updatedProfile, error: updateError } = await adminSupabase
    .from("users")
    .update({
      auth_user_id: user.id,
    })
    .eq("id", emailProfile.id)
    .select("id,auth_user_id,email,name,role,created_at")
    .single();

  if (updateError) {
    if (isAuthSchemaMismatchError(updateError.message)) {
      return null;
    }

    throw new Error(updateError.message);
  }

  return updatedProfile as AppUser;
}

export const getAuthenticatedViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError && !isAuthSessionMissingError(sessionError.message)) {
    throw new Error(sessionError.message);
  }

  if (!session?.access_token) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isAuthSessionMissingError(error.message)) {
      return null;
    }

    throw new Error(error.message);
  }

  if (!user) {
    return null;
  }

  const currentUser = await getProfileForAuthUser(user).catch((profileError: Error) => {
    if (isAuthSchemaMismatchError(profileError.message)) {
      return null;
    }

    throw profileError;
  });

  if (!currentUser) {
    return null;
  }

  return {
    authUserId: user.id,
    role: currentUser.role,
    currentUser,
    dashboardPath: getDashboardPath(currentUser.role),
  };
});

export async function requireAuthenticatedViewer(allowedRoles?: UserRole[]) {
  const viewer = await getAuthenticatedViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(viewer.role)) {
    redirect(getDashboardPath(viewer.role));
  }

  return viewer;
}

export { authSchemaMismatchMessage };
