import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SubmissionForm } from "@/components/SubmissionForm";
import { getAssignmentById, getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: { assignmentId: string };
}) {
  const viewer = await getCurrentViewer();
  const detail = await getAssignmentById(params.assignmentId, viewer);

  if (!detail) {
    notFound();
  }

  return (
    <AppShell
      title={detail.assignment.title}
      description={`Course ${detail.course.title} · Due ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(detail.assignment.dueDate))}`}
      viewer={viewer}
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Assignment brief</p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{detail.assignment.description}</p>
          </div>
          <Link
            href={`/student/courses/${detail.course.id}`}
            className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300"
          >
            Back to course
          </Link>
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
        <SubmissionForm
          assignmentId={detail.assignment.id}
          redirectPath={`/student/assignments/${detail.assignment.id}`}
          existingSubmission={detail.studentSubmission}
          disabled={!detail.isStudentEnrolled}
        />

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Class activity</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Assignment status</h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Submissions</p>
              <p className="mt-2 text-3xl font-semibold text-white">{detail.assignment.submissionCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Graded</p>
              <p className="mt-2 text-3xl font-semibold text-white">{detail.assignment.gradedCount}</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
