import { AppShell } from "@/components/AppShell";
import { CourseCard } from "@/components/CourseCard";
import { getCourses, getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const viewer = await getCurrentViewer();
  const courses = await getCourses(viewer);

  return (
    <AppShell
      title="Student Dashboard"
      description="Review enrolled courses, lesson tasks, due dates, and course grades from one place."
      viewer={viewer}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Courses joined", value: courses.length },
          { label: "Teachers", value: new Set(courses.map((course) => course.teacherId)).size },
          { label: "Available modules", value: courses.reduce((sum, course) => sum + (course.moduleCount ?? 0), 0) },
          { label: "Active courses", value: courses.filter((course) => course.studentCount > 0).length },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Enrolled courses</h2>
          <a href="/student/courses" className="text-sm text-cyan-300">View all</a>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {courses.slice(0, 6).map((course) => (
            <CourseCard key={course.id} course={course} href={`/student/courses/${course.id}`} />
          ))}
          {courses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">You are not enrolled in any courses yet.</div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
