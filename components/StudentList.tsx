import { enrollStudent } from "@/lib/dbActions";
import type { AppUser } from "@/lib/types";

interface StudentListProps {
  students: AppUser[];
  studentOptions: AppUser[];
  courseId: string;
  redirectPath: string;
  canManage: boolean;
}

export function StudentList({
  students,
  studentOptions,
  courseId,
  redirectPath,
  canManage,
}: StudentListProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Roster</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Enrolled students</h3>
          <p className="mt-1 text-sm text-slate-400">
            {canManage
              ? "Add existing student accounts into the course roster."
              : "Students currently enrolled in this course."}
          </p>
        </div>
        {canManage ? (
          <form action={enrollStudent} className="w-full max-w-md space-y-3">
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="redirectPath" value={redirectPath} />
            <select
              name="studentId"
              required
              defaultValue=""
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
            >
              <option value="" disabled>
                Select a student
              </option>
              {studentOptions.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
            <button className="w-full rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-500/20">
              Enroll student
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {students.length > 0 ? (
          students.map((student) => (
            <div key={student.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm font-medium text-white">{student.name}</p>
              <p className="mt-1 text-xs text-slate-400">{student.email}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">Student</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-6 text-sm text-slate-400">
            No students enrolled yet.
          </div>
        )}
      </div>
    </section>
  );
}
