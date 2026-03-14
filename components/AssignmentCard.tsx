import Link from "next/link";
import type { AssignmentListItem } from "@/lib/types";

interface AssignmentCardProps {
  assignment: AssignmentListItem;
  href?: string;
}

export function AssignmentCard({ assignment, href }: AssignmentCardProps) {
  const dueDate = new Date(assignment.dueDate);
  const isLate = dueDate.getTime() < Date.now();

  const content = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{assignment.courseTitle}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{assignment.title}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isLate ? "bg-rose-500/15 text-rose-200" : "bg-emerald-500/15 text-emerald-200"
          }`}
        >
          Due {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric" }).format(dueDate)}
        </span>
      </div>
      <p className="mt-4 line-clamp-3 text-sm text-slate-400">{assignment.description}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-900/70 p-3 text-slate-300">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Submissions</p>
          <p className="mt-2 text-lg font-semibold text-white">{assignment.submissionCount}</p>
        </div>
        <div className="rounded-2xl bg-slate-900/70 p-3 text-slate-300">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Graded</p>
          <p className="mt-2 text-lg font-semibold text-white">{assignment.gradedCount}</p>
        </div>
      </div>
      {assignment.studentSubmission ? (
        <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
          {assignment.studentSubmission.grade !== null
            ? `Grade posted: ${assignment.studentSubmission.grade}`
            : "Submitted and awaiting feedback"}
        </div>
      ) : null}
    </>
  );

  if (!href) {
    return <article className="rounded-3xl border border-white/10 bg-white/5 p-5">{content}</article>;
  }

  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/8"
    >
      {content}
    </Link>
  );
}
