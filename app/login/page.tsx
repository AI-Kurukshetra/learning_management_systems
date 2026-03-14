import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getAuthenticatedViewer } from "@/lib/auth";
import { login } from "@/lib/dbActions";
import { resolveAuthorizedRedirect } from "@/lib/roles";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; error?: string };
}) {
  const viewer = await getAuthenticatedViewer();

  if (viewer) {
    redirect(resolveAuthorizedRedirect(viewer.role, searchParams.redirectTo));
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#0f172a_48%,_#111827_100%)] px-6 py-12 text-slate-100 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr,0.85fr]">
        <section>
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">EduFlow access</p>
          <h1 className="mt-6 max-w-2xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            Login to your role-based workspace.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Authentication runs through Supabase Auth and every protected route is checked again in middleware before the page renders.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Admin", text: "Manage users, courses, and enrollments." },
              { label: "Teacher", text: "Create assignments and grade submissions." },
              { label: "Student", text: "View courses, submit work, and see grades." },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{item.label}</p>
                <p className="mt-3 text-sm text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Sign in</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Email and password</h2>
          <p className="mt-3 text-sm text-slate-400">
            Use the account provisioned in Supabase Auth. After login, EduFlow redirects you to the dashboard that matches your role in the users table.
          </p>
          <LoginForm action={login} redirectTo={searchParams.redirectTo} error={searchParams.error} />
        </section>
      </div>
    </main>
  );
}
