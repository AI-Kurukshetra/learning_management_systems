import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedViewer } from "@/lib/auth";

export default async function HomePage() {
  const viewer = await getAuthenticatedViewer();

  if (viewer) {
    redirect(viewer.dashboardPath);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">EduFlow</p>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            Secure role-based learning management with Supabase Auth.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Sign in with your EduFlow account to access the admin control panel, teacher workspace, or student dashboard.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-500/10 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Protected access</p>
            <ul className="mt-5 space-y-4 text-sm text-slate-300">
              <li>Admins manage teachers, students, courses, and enrollments.</li>
              <li>Teachers publish assignments and grade submissions.</li>
              <li>Students review coursework, submit responses, and track grades.</li>
            </ul>
            <Link
              href="/login"
              className="mt-8 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Go to login
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Stack</p>
            <ul className="mt-5 space-y-4 text-sm text-slate-300">
              <li>Next.js 14 App Router</li>
              <li>Supabase Auth with cookie sessions</li>
              <li>Middleware-enforced role checks</li>
              <li>Dedicated dashboards for admin, teacher, and student users</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
