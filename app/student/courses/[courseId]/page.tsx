import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AssignmentCard } from "@/components/AssignmentCard";
import { StudentList } from "@/components/StudentList";
import { getCourseById, getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function StudentCourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const viewer = await getCurrentViewer();
  const detail = await getCourseById(params.courseId, viewer);

  if (!detail) {
    notFound();
  }

  return (
    <AppShell
      title={detail.course.title}
      description={`Instructor ${detail.course.teacherName} · ${detail.course.studentCount} students · ${detail.course.assignmentCount} assignments`}
      viewer={viewer}
    >
      <div className="grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
        <StudentList
          students={detail.students}
          studentOptions={[]}
          courseId={detail.course.id}
          redirectPath={`/student/courses/${detail.course.id}`}
          canManage={false}
        />
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Assignments</h2>
            <Link href="/student/assignments" className="text-sm text-cyan-300">
              View all assignments
            </Link>
          </div>
          <div className="space-y-4">
            {detail.assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                href={`/student/assignments/${assignment.id}`}
              />
            ))}
            {detail.assignments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                No assignments have been created for this course yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
