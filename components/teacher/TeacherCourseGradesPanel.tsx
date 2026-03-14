"use client";

import { useFormState } from "react-dom";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { initialCourseBuilderActionState, type CourseBuilderActionState } from "@/lib/course-builder";
import type { AppUser, CourseStudentGradeItem } from "@/lib/types";

interface TeacherCourseGradesPanelProps {
  courseId: string;
  students: AppUser[];
  grades: CourseStudentGradeItem[];
  saveGradeAction: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
}

function GradeRow({
  courseId,
  student,
  existingGrade,
  saveGradeAction,
}: {
  courseId: string;
  student: AppUser;
  existingGrade: CourseStudentGradeItem | null;
  saveGradeAction: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
}) {
  const [state, formAction] = useFormState(saveGradeAction, initialCourseBuilderActionState);

  return (
    <form action={formAction} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="studentId" value={student.id} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{student.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{student.email}</p>
        </div>
        <div className="grid w-full gap-4 lg:max-w-xl lg:grid-cols-[120px,1fr]">
          <label className="text-sm text-slate-300">
            Grade
            <input
              type="number"
              min="0"
              max="100"
              name="grade"
              defaultValue={existingGrade?.grade ?? ""}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
            />
          </label>
          <label className="text-sm text-slate-300">
            Comments
            <textarea
              name="comments"
              rows={4}
              defaultValue={existingGrade?.comments ?? ""}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
            />
          </label>
        </div>
      </div>
      {state.error ? <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{state.error}</div> : null}
      {state.success && state.message ? <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{state.message}</div> : null}
      <div className="mt-4 flex justify-end">
        <AdminFormSubmitButton idleLabel="Save grade" loadingLabel="Saving grade..." className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" />
      </div>
    </form>
  );
}

export function TeacherCourseGradesPanel({ courseId, students, grades, saveGradeAction }: TeacherCourseGradesPanelProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Course grading</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Grade students for this course</h2>
        <p className="mt-2 text-sm text-slate-400">Provide a grade and comments per student at the course level.</p>
      </div>

      {students.map((student) => (
        <GradeRow
          key={student.id}
          courseId={courseId}
          student={student}
          existingGrade={grades.find((grade) => grade.studentId === student.id) ?? null}
          saveGradeAction={saveGradeAction}
        />
      ))}

      {students.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">No enrolled students to grade yet.</div> : null}
    </section>
  );
}
