import { submitAssignment } from "@/lib/dbActions";
import type { SubmissionItem } from "@/lib/types";

interface SubmissionFormProps {
  assignmentId: string;
  redirectPath: string;
  existingSubmission: SubmissionItem | null;
  disabled?: boolean;
}

export function SubmissionForm({
  assignmentId,
  redirectPath,
  existingSubmission,
  disabled = false,
}: SubmissionFormProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Submission</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Turn in your response</h3>
          <p className="mt-1 text-sm text-slate-400">
            Submit a written answer. Re-submitting replaces the previous draft and clears the existing grade.
          </p>
        </div>
        {existingSubmission ? (
          <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
            Submitted
          </span>
        ) : null}
      </div>

      {disabled ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-900/60 p-4 text-sm text-slate-400">
          You need to be enrolled in this course before you can submit work.
        </div>
      ) : (
        <form action={submitAssignment} className="mt-6 space-y-4">
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="redirectPath" value={redirectPath} />
          <textarea
            name="content"
            required
            rows={8}
            defaultValue={existingSubmission?.content ?? ""}
            placeholder="Write your assignment response here..."
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
          />
          <button className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
            {existingSubmission ? "Update submission" : "Submit assignment"}
          </button>
        </form>
      )}

      {existingSubmission ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Grade</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {existingSubmission.grade !== null ? existingSubmission.grade : "Pending"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Feedback</p>
            <p className="mt-2 text-sm text-slate-300">
              {existingSubmission.feedback ?? "Your teacher has not posted feedback yet."}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
