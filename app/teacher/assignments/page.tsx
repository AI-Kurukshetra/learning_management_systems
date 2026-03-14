import { AppShell } from "@/components/AppShell";
import { AssignmentCard } from "@/components/AssignmentCard";
import { getAssignments, getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function TeacherAssignmentsPage() {
  const viewer = await getCurrentViewer();
  const assignments = await getAssignments({ viewer });

  return (
    <AppShell
      title="Teacher Assignments"
      description="View published assignments, submission counts, and grading progress across your courses."
      viewer={viewer}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            href={`/teacher/assignments/${assignment.id}`}
          />
        ))}
        {assignments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
            No assignments are available yet.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
