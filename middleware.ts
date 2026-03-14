import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { authSchemaMismatchMessage, isAuthSchemaMismatchError, isAuthSessionMissingError } from "@/lib/auth-errors";
import { canAccessPath, getDashboardPath, resolveAuthorizedRedirect } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const publicAnon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const protectedPrefixes = ["/admin", "/teacher", "/student", "/parent"];
const missingProfileMessage = "Invalid email or password combination.";

async function getUserRole(authUserId: string, email?: string | null) {
  if (!publicUrl || !serviceRole) {
    return null;
  }

  const adminSupabase = createClient(publicUrl, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: linkedProfile, error: linkedProfileError } = await adminSupabase
    .from("users")
    .select("role")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (linkedProfileError) {
    throw new Error(linkedProfileError.message);
  }

  if (linkedProfile?.role) {
    return linkedProfile.role as UserRole;
  }

  if (!email) {
    return null;
  }

  const normalizedEmail = email.toLowerCase();
  const { data: emailProfile, error: emailProfileError } = await adminSupabase
    .from("users")
    .select("id,role")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (emailProfileError) {
    throw new Error(emailProfileError.message);
  }

  if (!emailProfile?.role) {
    return null;
  }

  const { error: updateError } = await adminSupabase
    .from("users")
    .update({ auth_user_id: authUserId })
    .eq("id", emailProfile.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return emailProfile.role as UserRole;
}

function buildSchemaLoginUrl(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", authSchemaMismatchMessage);
  return loginUrl;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isLoginRoute = pathname === "/login";
  const isRootRoute = pathname === "/";

  let response = NextResponse.next({
    request,
  });

  if (!publicUrl || !publicAnon) {
    return response;
  }

  const supabase = createServerClient(publicUrl, publicAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && isAuthSessionMissingError(userError.message)) {
    if (isProtectedRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);

      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  if (userError) {
    throw userError;
  }

  if (!user) {
    if (isProtectedRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);

      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  let role: UserRole | null;

  try {
    role = await getUserRole(user.id, user.email);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (isAuthSchemaMismatchError(message)) {
      if (isLoginRoute && request.nextUrl.searchParams.get("error") === authSchemaMismatchMessage) {
        return response;
      }

      return NextResponse.redirect(buildSchemaLoginUrl(request));
    }

    throw error;
  }

  if (!role) {
    if (isLoginRoute) {
      return response;
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", missingProfileMessage);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute || isRootRoute) {
    return NextResponse.redirect(
      new URL(resolveAuthorizedRedirect(role, request.nextUrl.searchParams.get("redirectTo")), request.url),
    );
  }

  if (isProtectedRoute && !canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/teacher/:path*", "/student/:path*", "/parent/:path*"],
};

