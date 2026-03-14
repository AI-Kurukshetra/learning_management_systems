import type { ParentCourseItem } from "@/lib/types";

interface CourseTableProps {
  courses: ParentCourseItem[];
}

export function CourseTable({ courses }: CourseTableProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Courses</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Enrolled classes</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {courses.length} courses
        </span>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-slate-950/70 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Teacher</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-900/50">
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-4 py-4 text-white">{course.title}</td>
                <td className="px-4 py-4 text-slate-300">
                  <p>{course.teacherName}</p>
                  <p className="text-xs text-slate-500">{course.teacherEmail}</p>
                </td>
              </tr>
            ))}
            {courses.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-slate-400">
                  No linked courses found for this child.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
