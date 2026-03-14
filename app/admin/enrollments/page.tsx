import { AppShell } from "@/components/AppShell";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { assignCourseEnrollments, deleteEnrollment, getCourses, getCurrentViewer, getEnrollments, getUsersByRole } from "@/lib/dbActions";

export const dynamic = "force-dynamic";

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const viewer = await getCurrentViewer();
  const [courses, teachers, students, enrollments] = await Promise.all([
    getCourses(viewer),
    getUsersByRole("teacher"),
    getUsersByRole("student"),
    getEnrollments(),
  ]);
  const query = searchParams.q?.trim() ?? "";
  const filteredEnrollments = query
    ? enrollments.filter(
        (enrollment) =>
          matchesQuery(enrollment.courseTitle, query) ||
          matchesQuery(enrollment.teacherName, query) ||
          matchesQuery(enrollment.studentName, query) ||
          matchesQuery(enrollment.studentEmail, query),
      )
    : enrollments;

  return (
    <AppShell
      title="Enrollments"
      description="Assign a course to a teacher and enroll multiple students from one admin workflow."
      viewer={viewer}
    >
      <section className="grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Bulk assignment</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Assign course, teacher, and students</h2>
            <form action={assignCourseEnrollments} className="mt-6 space-y-4">
              <input type="hidden" name="redirectPath" value="/admin/enrollments" />
              <select
                name="courseId"
                required
                defaultValue=""
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
              >
                <option value="" disabled>
                  Select a course
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <select
                name="teacherId"
                required
                defaultValue=""
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
              >
                <option value="" disabled>
                  Select a teacher
                </option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
              <label className="block text-sm text-slate-300">
                Students
                <select
                  name="studentIds"
                  multiple
                  size={8}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-slate-400">
                Hold Ctrl or Cmd to select multiple students for the same course assignment.
              </p>
              <AdminFormSubmitButton
                idleLabel="Save assignments"
                loadingLabel="Saving assignments..."
                className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              />
            </form>
          </div>

          <form method="get" className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Search</p>
            <div className="mt-4 flex gap-3">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search by course, teacher, or student"
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
              />
              <button className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20">
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {filteredEnrollments.map((enrollment) => (
            <div key={enrollment.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">{enrollment.courseTitle}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{enrollment.studentName}</h3>
              <p className="mt-1 text-sm text-slate-400">{enrollment.studentEmail}</p>
              <p className="mt-3 text-sm text-slate-400">
                Teacher: {enrollment.teacherName} ({enrollment.teacherEmail})
              </p>
              <form action={deleteEnrollment} className="mt-4">
                <input type="hidden" name="enrollmentId" value={enrollment.id} />
                <input type="hidden" name="redirectPath" value="/admin/enrollments" />
                <AdminFormSubmitButton
                  idleLabel="Delete enrollment"
                  loadingLabel="Deleting..."
                  className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                />
              </form>
            </div>
          ))}
          {filteredEnrollments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
              No enrollments matched your search.
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
