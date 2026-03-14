import { AppShell } from "@/components/AppShell";
import { ChildOverviewCard } from "@/components/ChildOverviewCard";
import { CourseTable } from "@/components/CourseTable";
import { getCurrentViewer } from "@/lib/dbActions";
import { getChildAssignments, getParentDashboardData } from "@/lib/parent-actions";
import { formatDateDdMmYyyy } from "@/lib/date-format";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const [viewer, dashboard, assignments] = await Promise.all([
    getCurrentViewer(),
    getParentDashboardData(),
    getChildAssignments(),
  ]);

  return (
    <AppShell
      title="Parent Dashboard"
      description="Monitor your linked child, stay on top of deadlines, and keep teacher communication in one place."
      viewer={viewer}
    >
      {dashboard.child ? (
        <div className="space-y-8">
          <ChildOverviewCard child={dashboard.child} overview={dashboard.overview} />
          <section className="grid gap-8 xl:grid-cols-[1.05fr,0.95fr]">
            <CourseTable courses={dashboard.courses} />
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Assignments</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Upcoming work</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {assignments.length} items
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {assignments.slice(0, 6).map((assignment) => (
                  <article key={assignment.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <p className="font-medium text-white">{assignment.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{assignment.courseName}</p>
                    <p className="mt-3 text-sm text-slate-300">Due {formatDateDdMmYyyy(assignment.dueDate)}</p>
                  </article>
                ))}
                {assignments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                    No assignments found for the linked child.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No child is linked to this parent account yet. Ask an admin to link this parent to a student from the admin parents module.
        </div>
      )}
    </AppShell>
  );
}
