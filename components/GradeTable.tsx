import { generateAiFeedback, gradeSubmission } from "@/lib/dbActions";
import type { SubmissionItem } from "@/lib/types";

interface GradeTableProps {
  submissions: SubmissionItem[];
  assignmentId: string;
  assignmentTitle: string;
  redirectPath: string;
}

export function GradeTable({
  submissions,
  assignmentId,
  assignmentTitle,
  redirectPath,
}: GradeTableProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Review queue</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Grade submissions</h3>
          <p className="mt-1 text-sm text-slate-400">
            Score student work and keep feedback consistent with the AI suggestion helper.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
          {submissions.length} submissions
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <article key={submission.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-lg font-semibold text-white">{submission.studentName}</h4>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                      Submitted {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(submission.submittedAt))}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{submission.studentEmail}</p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{submission.content}</p>
                </div>

                <div className="w-full max-w-xl space-y-4">
                  <form action={gradeSubmission} className="grid gap-3 md:grid-cols-[120px,1fr]">
                    <input type="hidden" name="submissionId" value={submission.id} />
                    <input type="hidden" name="assignmentId" value={assignmentId} />
                    <input type="hidden" name="redirectPath" value={redirectPath} />
                    <label className="text-sm text-slate-300">
                      Grade
                      <input
                        type="number"
                        min="0"
                        max="100"
                        name="grade"
                        defaultValue={submission.grade ?? ""}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      Feedback
                      <textarea
                        name="feedback"
                        rows={4}
                        defaultValue={submission.feedback ?? ""}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                      />
                    </label>
                    <button className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 md:col-span-2">
                      Save grade
                    </button>
                  </form>

                  <form action={generateAiFeedback}>
                    <input type="hidden" name="submissionId" value={submission.id} />
                    <input type="hidden" name="assignmentId" value={assignmentId} />
                    <input type="hidden" name="assignmentTitle" value={assignmentTitle} />
                    <input type="hidden" name="content" value={submission.content} />
                    <input type="hidden" name="redirectPath" value={redirectPath} />
                    <button className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20">
                      Generate AI feedback
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-6 text-sm text-slate-400">
            No submissions yet. Once students respond, their work will appear here.
          </div>
        )}
      </div>
    </section>
  );
}
