import { createClient } from '@supabase/supabase-js';

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const publicAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv() {
  if (!publicUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) is required.');
  }

  if (!publicAnon && !serviceRole) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is required.'
    );
  }
}

export function createBrowserSupabaseClient() {
  if (!publicUrl || !publicAnon) {
    return null;
  }

  return createClient(publicUrl, publicAnon, {
    auth: { persistSession: true, detectSessionInUrl: true },
  });
}

export function createServerSupabaseClient() {
  assertEnv();
  const key = serviceRole ?? publicAnon;
  return createClient(publicUrl, key);
}

export const supabaseEnvMessage = publicUrl && (publicAnon || serviceRole)
  ? 'Supabase env variables detected.'
  : 'Missing Supabase URL and/or keys.';
