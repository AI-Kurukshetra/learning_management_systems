import { AppShell } from "@/components/AppShell";
import { ChildOverviewCard } from "@/components/ChildOverviewCard";
import { getCurrentViewer } from "@/lib/dbActions";
import { getChildAssignments, getParentDashboardData } from "@/lib/parent-actions";
import { formatDateDdMmYyyy } from "@/lib/date-format";

export const dynamic = "force-dynamic";

export default async function ParentChildrenPage() {
  const [viewer, dashboard, assignments] = await Promise.all([
    getCurrentViewer(),
    getParentDashboardData(),
    getChildAssignments(),
  ]);

  return (
    <AppShell
      title="Child Details"
      description="Single-child academic snapshot for this parent account."
      viewer={viewer}
    >
      {dashboard.child ? (
        <div className="space-y-8">
          <ChildOverviewCard child={dashboard.child} overview={dashboard.overview} />
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Recent assignments</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Current workload</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {assignments.slice(0, 6).map((assignment) => (
                <article key={assignment.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="font-medium text-white">{assignment.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{assignment.courseName}</p>
                  <p className="mt-3 text-sm text-slate-300">Due {formatDateDdMmYyyy(assignment.dueDate)}</p>
                </article>
              ))}
              {assignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                  No assignments are available for the linked child.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No child is linked to this parent account yet.
        </div>
      )}
    </AppShell>
  );
}
