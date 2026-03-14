import { AppShell } from "@/components/AppShell";
import { CourseCard } from "@/components/CourseCard";
import { getCourses, getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const viewer = await getCurrentViewer();
  const courses = await getCourses(viewer);

  return (
    <AppShell
      title="Teacher Dashboard"
      description="Track assigned courses, lesson delivery, and student progress from one workspace."
      viewer={viewer}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Courses taught", value: courses.length },
          { label: "Students reached", value: courses.reduce((sum, course) => sum + course.studentCount, 0) },
          { label: "Active rosters", value: courses.filter((course) => course.studentCount > 0).length },
          { label: "Published modules", value: courses.reduce((sum, course) => sum + (course.moduleCount ?? 0), 0) },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Assigned courses</h2>
          <a href="/teacher/courses" className="text-sm text-cyan-300">View all</a>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {courses.slice(0, 6).map((course) => (
            <CourseCard key={course.id} course={course} href={`/teacher/courses/${course.id}`} />
          ))}
          {courses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">No courses have been assigned yet.</div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
