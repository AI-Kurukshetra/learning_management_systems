import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const publicAnon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv() {
  if (!publicUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) is required.");
  }

  if (!publicAnon) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) is required for Supabase Auth.",
    );
  }
}

export function createBrowserSupabaseClient() {
  assertEnv();

  return createBrowserClient(publicUrl!, publicAnon!);
}

export function createServerSupabaseClient() {
  assertEnv();

  const cookieStore = cookies();

  return createServerClient(publicUrl!, publicAnon!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Middleware/server actions handle refreshes.
        }
      },
    },
  });
}

export function createServiceRoleSupabaseClient() {
  assertEnv();

  if (!serviceRole) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for privileged data access.");
  }

  return createClient(publicUrl!, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createMiddlewareSupabaseClient(request: NextRequest) {
  assertEnv();

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(publicUrl!, publicAnon!, {
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

  return {
    supabase,
    getResponse() {
      return response;
    },
  };
}

export const supabaseEnvMessage =
  publicUrl && publicAnon
    ? "Supabase auth env variables detected."
    : "Missing Supabase URL and/or anon key.";
