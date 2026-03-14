import { AppShell } from "@/components/AppShell";
import { AdminCreateUserForm } from "@/components/admin/AdminCreateUserForm";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { createManagedUser, deleteManagedUser, getCurrentViewer, getUsersByRole, updateManagedUser } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const viewer = await getCurrentViewer();
  const teachers = await getUsersByRole("teacher");
  const query = searchParams.q?.trim() ?? "";
  const filteredTeachers = query
    ? teachers.filter(
        (teacher) => matchesQuery(teacher.name, query) || matchesQuery(teacher.email, query),
      )
    : teachers;

  return (
    <AppShell
      title="Teachers"
      description="Create, search, update, and remove teacher accounts from the admin module."
      viewer={viewer}
    >
      <section className="grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Create teacher</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Add a new teacher</h2>
            <AdminCreateUserForm role="teacher" action={createManagedUser} />
          </div>

          <form method="get" className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Search</p>
            <div className="mt-4 flex gap-3">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search teachers by name or email"
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
              />
              <button className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20">
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <form action={updateManagedUser} className="grid gap-4 lg:grid-cols-[1fr,1fr,140px] lg:items-end">
                <input type="hidden" name="userId" value={teacher.id} />
                <input type="hidden" name="role" value="teacher" />
                <input type="hidden" name="redirectPath" value="/admin/teachers" />
                <label className="text-sm text-slate-300">
                  Name
                  <input
                    name="name"
                    defaultValue={teacher.name}
                    required
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                  />
                </label>
                <label className="text-sm text-slate-300">
                  Email
                  <input
                    value={teacher.email}
                    readOnly
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-400 outline-none"
                  />
                </label>
                <AdminFormSubmitButton
                  idleLabel="Save"
                  loadingLabel="Saving..."
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                />
              </form>
              <form action={deleteManagedUser} className="mt-4">
                <input type="hidden" name="userId" value={teacher.id} />
                <input type="hidden" name="redirectPath" value="/admin/teachers" />
                <AdminFormSubmitButton
                  idleLabel="Delete teacher"
                  loadingLabel="Deleting..."
                  className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                />
              </form>
            </div>
          ))}
          {filteredTeachers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
              No teachers matched your search.
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
