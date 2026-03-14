import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getAllUsers, getAssignments, getCourses, getEnrollments } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { viewer, users } = await getAllUsers();
  const [courses, assignments, enrollments] = await Promise.all([
    getCourses(viewer),
    getAssignments({ viewer }),
    getEnrollments(),
  ]);

  const teachers = users.filter((user) => user.role === "teacher").length;
  const students = users.filter((user) => user.role === "student").length;

  return (
    <AppShell
      title="Admin Dashboard"
      description="Navigate the teacher, student, course, and enrollment modules from the protected admin panel."
      viewer={viewer}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Teachers", value: teachers, href: "/admin/teachers" },
          { label: "Students", value: students, href: "/admin/students" },
          { label: "Courses", value: courses.length, href: "/admin/courses" },
          { label: "Enrollments", value: enrollments.length, href: "/admin/enrollments" },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/30 hover:bg-white/10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{item.value}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent teachers</h2>
            <Link href="/admin/teachers" className="text-sm text-cyan-300">
              Open module
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {users
              .filter((user) => user.role === "teacher")
              .slice(-5)
              .reverse()
              .map((user) => (
                <div key={user.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Course load</h2>
            <Link href="/admin/courses" className="text-sm text-cyan-300">
              Open module
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assignments</p>
              <p className="mt-2 text-3xl font-semibold text-white">{assignments.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Courses with work</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {courses.filter((course) => course.assignmentCount > 0).length}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {courses.slice(0, 4).map((course) => (
              <div key={course.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="font-medium text-white">{course.title}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {course.teacherName} · {course.studentCount} students · {course.assignmentCount} assignments
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
