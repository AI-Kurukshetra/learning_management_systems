import { AppShell } from "@/components/AppShell";
import { CourseCard } from "@/components/CourseCard";
import { getCourses, getCurrentViewer } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function StudentCoursesPage() {
  const viewer = await getCurrentViewer();
  const courses = await getCourses(viewer);

  return (
    <AppShell
      title="Student Courses"
      description="Browse every course you are enrolled in and open each class workspace."
      viewer={viewer}
    >
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} href={`/student/courses/${course.id}`} />
        ))}
        {courses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
            You are not enrolled in any courses yet.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
