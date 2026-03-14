import { AppShell } from "@/components/AppShell";
import { AssignmentCard } from "@/components/AssignmentCard";
import { CourseCard } from "@/components/CourseCard";
import { getAssignments, getCourses, getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const viewer = await getCurrentViewer();
  const [courses, assignments] = await Promise.all([
    getCourses(viewer),
    getAssignments({ viewer }),
  ]);

  const pendingReviews = assignments.reduce(
    (total, assignment) => total + (assignment.submissionCount - assignment.gradedCount),
    0,
  );

  return (
    <AppShell
      title="Teacher Dashboard"
      description="Track assigned courses, publish new work, and stay on top of grading activity."
      viewer={viewer}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Courses taught", value: courses.length },
          { label: "Assignments", value: assignments.length },
          { label: "Pending reviews", value: pendingReviews },
          {
            label: "Students reached",
            value: courses.reduce((sum, course) => sum + course.studentCount, 0),
          },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1.2fr,0.8fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Assigned courses</h2>
            <a href="/teacher/courses" className="text-sm text-cyan-300">
              View all
            </a>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {courses.slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} href={`/teacher/courses/${course.id}`} />
            ))}
            {courses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                No courses have been assigned yet.
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent assignments</h2>
            <a href="/teacher/assignments" className="text-sm text-cyan-300">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {assignments.slice(0, 3).map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                href={`/teacher/assignments/${assignment.id}`}
              />
            ))}
            {assignments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                No assignments yet.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
