import type { AppUser, ParentChildOverview } from "@/lib/types";

interface ChildOverviewCardProps {
  child: AppUser;
  overview: ParentChildOverview;
}

export function ChildOverviewCard({ child, overview }: ChildOverviewCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Child overview</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">{child.name}</h2>
          <p className="mt-1 text-sm text-slate-400">Student account linked to this parent workspace.</p>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          Protected parent view
        </span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-2xl bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Courses</p>
          <p className="mt-2 text-3xl font-semibold text-white">{overview.courseCount}</p>
        </div>
        <div className="rounded-2xl bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assignments</p>
          <p className="mt-2 text-3xl font-semibold text-white">{overview.totalAssignments}</p>
        </div>
        <div className="rounded-2xl bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Average grade</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {overview.averageGrade === null ? "N/A" : `${overview.averageGrade.toFixed(1)}%`}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Child role</p>
          <p className="mt-2 text-3xl font-semibold capitalize text-white">{child.role}</p>
        </div>
      </div>
    </section>
  );
}
