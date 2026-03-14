import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const [usersResult, coursesResult, assignmentsResult, submissionsResult] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('assignments').select('*', { count: 'exact', head: true }),
      supabase.from('submissions').select('*', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      status: 'ok',
      counts: {
        users: usersResult.count ?? 0,
        courses: coursesResult.count ?? 0,
        assignments: assignmentsResult.count ?? 0,
        submissions: submissionsResult.count ?? 0,
      },
      errors: [usersResult.error, coursesResult.error, assignmentsResult.error, submissionsResult.error]
        .filter(Boolean)
        .map((error) => error?.message),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

