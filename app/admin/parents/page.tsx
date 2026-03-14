import { formatDateTimeDdMmYyyy } from "@/lib/date-format";
import { AppShell } from "@/components/AppShell";
import { AdminCreateUserForm } from "@/components/admin/AdminCreateUserForm";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { createManagedUser, deleteManagedUser, getCurrentViewer, updateManagedUser } from "@/lib/dbActions";
import { getAdminParentManagementData, linkParentToStudentAction } from "@/lib/parent-actions";

export const dynamic = "force-dynamic";

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default async function AdminParentsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const [viewer, management] = await Promise.all([
    getCurrentViewer(),
    getAdminParentManagementData(),
  ]);
  const query = searchParams.q?.trim() ?? "";
  const filteredParents = query
    ? management.parents.filter(
        (parent) => matchesQuery(parent.name, query) || matchesQuery(parent.email, query),
      )
    : management.parents;
  const linkMap = new Map(management.links.map((link) => [link.parentId, link]));

  return (
    <AppShell
      title="Parents"
      description="Create parent accounts and manage the persistent parent-to-student link."
      viewer={viewer}
    >
      <section className="grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Create parent</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Add a new parent</h2>
            <AdminCreateUserForm role="parent" action={createManagedUser} />
          </div>

          <form method="get" className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Search</p>
            <div className="mt-4 flex gap-3">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search parents by name or email"
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
              />
              <button className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20">
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {filteredParents.map((parent) => {
            const linkedChild = linkMap.get(parent.id) ?? null;

            return (
              <div key={parent.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 rounded-2xl border border-cyan-400/15 bg-cyan-500/5 p-4 text-sm text-slate-300">
                  <p className="font-medium text-white">{parent.name}</p>
                  <p className="mt-1 text-slate-400">{parent.email}</p>
                  <p className="mt-3">
                    Linked child: {linkedChild ? `${linkedChild.studentName} (${linkedChild.studentEmail})` : "No student linked yet."}
                  </p>
                  {linkedChild ? (
                    <p className="mt-1 text-xs text-slate-500">Linked {formatDateTimeDdMmYyyy(linkedChild.linkedAt)}</p>
                  ) : null}
                </div>

                <form action={updateManagedUser} className="grid gap-4 lg:grid-cols-[1fr,1fr,140px] lg:items-end">
                  <input type="hidden" name="userId" value={parent.id} />
                  <input type="hidden" name="role" value="parent" />
                  <input type="hidden" name="redirectPath" value="/admin/parents" />
                  <label className="text-sm text-slate-300">
                    Name
                    <input
                      name="name"
                      defaultValue={parent.name}
                      required
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Email
                    <input
                      value={parent.email}
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

                <form action={linkParentToStudentAction} className="mt-4 grid gap-4 lg:grid-cols-[1fr,160px] lg:items-end">
                  <input type="hidden" name="parentId" value={parent.id} />
                  <input type="hidden" name="redirectPath" value="/admin/parents" />
                  <label className="text-sm text-slate-300">
                    Linked student
                    <select
                      name="studentId"
                      defaultValue={linkedChild?.studentId ?? ""}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                    >
                      <option value="">No linked student</option>
                      {management.students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </option>
                      ))}
                    </select>
                  </label>
                  <AdminFormSubmitButton
                    idleLabel="Save link"
                    loadingLabel="Saving..."
                    className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                  />
                </form>

                <form action={deleteManagedUser} className="mt-4">
                  <input type="hidden" name="userId" value={parent.id} />
                  <input type="hidden" name="redirectPath" value="/admin/parents" />
                  <AdminFormSubmitButton
                    idleLabel="Delete parent"
                    loadingLabel="Deleting..."
                    className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                  />
                </form>
              </div>
            );
          })}
          {filteredParents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
              No parents matched your search.
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

