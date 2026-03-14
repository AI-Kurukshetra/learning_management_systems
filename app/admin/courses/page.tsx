import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { COURSE_TEMPLATES } from "@/lib/course-builder";
import { createCourseWithTemplate } from "@/lib/course-builder-actions";
import {
  deleteCourse,
  getCourses,
  getCurrentViewer,
  getUsersByRole,
  updateCourse,
} from "@/lib/dbActions";

export const dynamic = "force-dynamic";

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const viewer = await getCurrentViewer();
  const [courses, teachers] = await Promise.all([getCourses(viewer), getUsersByRole("teacher")]);
  const query = searchParams.q?.trim() ?? "";
  const filteredCourses = query
    ? courses.filter(
        (course) =>
          matchesQuery(course.title, query) ||
          matchesQuery(course.teacherName, query) ||
          matchesQuery(course.teacherEmail, query),
      )
    : courses;

  return (
    <AppShell
      title="Courses"
      description="Search, create, update, and delete courses while assigning them to teachers. Open the builder to design curriculum modules and course structure."
      viewer={viewer}
    >
      <section className="grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Create course</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Assign a teacher and template</h2>
            <form action={createCourseWithTemplate} className="mt-6 space-y-4">
              <input type="hidden" name="redirectPath" value="/admin/courses" />
              <input
                name="title"
                required
                placeholder="Data Structures"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
              />
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
              <select
                name="templateKey"
                required
                defaultValue="custom"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
              >
                {COURSE_TEMPLATES.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.label}
                  </option>
                ))}
              </select>
              <AdminFormSubmitButton
                idleLabel="Create course"
                loadingLabel="Creating course..."
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
                placeholder="Search courses by title or teacher"
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
              />
              <button className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20">
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div key={course.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <form action={updateCourse} className="grid gap-4 lg:grid-cols-[1fr,1fr,140px] lg:items-end">
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="redirectPath" value="/admin/courses" />
                <label className="text-sm text-slate-300">
                  Title
                  <input
                    name="title"
                    defaultValue={course.title}
                    required
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                  />
                </label>
                <label className="text-sm text-slate-300">
                  Teacher
                  <select
                    name="teacherId"
                    defaultValue={course.teacherId}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                  >
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.email})
                      </option>
                    ))}
                  </select>
                </label>
                <AdminFormSubmitButton
                  idleLabel="Save"
                  loadingLabel="Saving..."
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                />
              </form>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span>{course.studentCount} students</span>
                <span>{course.moduleCount ?? 0} modules</span>
                <span>{course.teacherEmail}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                >
                  Open builder
                </Link>
                <form action={deleteCourse}>
                  <input type="hidden" name="courseId" value={course.id} />
                  <input type="hidden" name="redirectPath" value="/admin/courses" />
                  <AdminFormSubmitButton
                    idleLabel="Delete course"
                    loadingLabel="Deleting..."
                    className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                  />
                </form>
              </div>
            </div>
          ))}
          {filteredCourses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
              No courses matched your search.
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}





