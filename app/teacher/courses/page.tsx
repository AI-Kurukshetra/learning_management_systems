import { AppShell } from "@/components/AppShell";
import { CourseCard } from "@/components/CourseCard";
import { getCourses, getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function TeacherCoursesPage() {
  const viewer = await getCurrentViewer();
  const courses = await getCourses(viewer);

  return (
    <AppShell
      title="Teacher Courses"
      description="Courses currently assigned to you, with direct access to rosters and assignments."
      viewer={viewer}
    >
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} href={`/teacher/courses/${course.id}`} />
        ))}
        {courses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
            No courses assigned yet.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
