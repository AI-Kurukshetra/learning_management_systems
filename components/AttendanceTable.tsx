"use client";

import { useFormState } from "react-dom";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { initialCourseBuilderActionState, type CourseBuilderActionState } from "@/lib/course-builder";
import type { AppUser, AttendanceRecordItem } from "@/lib/types";

interface AttendanceTableProps {
  courseId: string;
  sessionDate: string;
  students: AppUser[];
  records: AttendanceRecordItem[];
  editable?: boolean;
  markAttendanceAction?: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
}

export function AttendanceTable({ courseId, sessionDate, students, records, editable = false, markAttendanceAction }: AttendanceTableProps) {
  const [state, formAction] = useFormState(markAttendanceAction ?? (async () => initialCourseBuilderActionState), initialCourseBuilderActionState);
  const recordMap = new Map(records.map((record) => [record.studentId, record]));

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Attendance</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Session register</h2>
      </div>

      <form action={editable ? formAction : undefined} className="mt-5 space-y-4">
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="sessionDate" value={sessionDate} />
        <div className="space-y-3">
          {students.map((student) => {
            const record = recordMap.get(student.id);
            return (
              <div key={student.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <input type="hidden" name="studentIds" value={student.id} />
                <div className="grid gap-4 lg:grid-cols-[1.1fr,180px,1fr]">
                  <div>
                    <p className="font-medium text-white">{student.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{student.email}</p>
                  </div>
                  <label className="text-sm text-slate-300">
                    Status
                    <select
                      name={`status_${student.id}`}
                      defaultValue={record?.status ?? "present"}
                      disabled={!editable}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40 disabled:opacity-70"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </label>
                  <label className="text-sm text-slate-300">
                    Notes
                    <input
                      name={`notes_${student.id}`}
                      defaultValue={record?.notes ?? ""}
                      disabled={!editable}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40 disabled:opacity-70"
                    />
                  </label>
                </div>
              </div>
            );
          })}
          {students.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No enrolled students.</div> : null}
        </div>
        {state.error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{state.error}</div> : null}
        {state.success && state.message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{state.message}</div> : null}
        {editable ? <AdminFormSubmitButton idleLabel="Save attendance" loadingLabel="Saving..." className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" /> : null}
      </form>
    </section>
  );
}