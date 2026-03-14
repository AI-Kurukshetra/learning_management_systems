import { AppShell } from "@/components/AppShell";
import { AdminCreateUserForm } from "@/components/admin/AdminCreateUserForm";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { createManagedUser, deleteManagedUser, getCurrentViewer, getUsersByRole, updateManagedUser } from "@/lib/dbActions";
import { getAllParentLinks } from "@/lib/parent-links-store";

export const dynamic = "force-dynamic";

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const [viewer, students, parents, links] = await Promise.all([
    getCurrentViewer(),
    getUsersByRole("student"),
    getUsersByRole("parent"),
    getAllParentLinks(),
  ]);
  const query = searchParams.q?.trim() ?? "";
  const filteredStudents = query
    ? students.filter(
        (student) => matchesQuery(student.name, query) || matchesQuery(student.email, query),
      )
    : students;
  const parentMap = new Map(parents.map((parent) => [parent.id, parent]));
  const studentToParentMap = new Map(links.map((link) => [link.studentId, link.parentId]));

  return (
    <AppShell
      title="Students"
      description="Create, search, update, and remove student accounts from the admin module."
      viewer={viewer}
    >
      <section className="grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Create student</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Add a new student</h2>
            <AdminCreateUserForm role="student" action={createManagedUser} parents={parents} />
          </div>

          <form method="get" className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Search</p>
            <div className="mt-4 flex gap-3">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search students by name or email"
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
              />
              <button className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20">
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const parentId = studentToParentMap.get(student.id) ?? null;
            const parent = parentId ? parentMap.get(parentId) ?? null : null;

            return (
              <div key={student.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                {parent ? (
                  <div className="mb-4 rounded-2xl border border-cyan-400/15 bg-cyan-500/5 p-4 text-sm text-slate-300">
                    Linked parent: <span className="font-medium text-white">{parent.name}</span> ({parent.email})
                  </div>
                ) : null}
                <form action={updateManagedUser} className="grid gap-4 lg:grid-cols-[1fr,1fr,140px] lg:items-end">
                  <input type="hidden" name="userId" value={student.id} />
                  <input type="hidden" name="role" value="student" />
                  <input type="hidden" name="redirectPath" value="/admin/students" />
                  <label className="text-sm text-slate-300">
                    Name
                    <input
                      name="name"
                      defaultValue={student.name}
                      required
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Email
                    <input
                      value={student.email}
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
                  <input type="hidden" name="userId" value={student.id} />
                  <input type="hidden" name="redirectPath" value="/admin/students" />
                  <AdminFormSubmitButton
                    idleLabel="Delete student"
                    loadingLabel="Deleting..."
                    className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                  />
                </form>
              </div>
            );
          })}
          {filteredStudents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
              No students matched your search.
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
