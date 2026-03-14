"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { initialCourseBuilderActionState, type CourseBuilderActionState } from "@/lib/course-builder";
import type { AssignmentListItem, CourseListItem, FileCategory } from "@/lib/types";

interface FileUploaderProps {
  courses: CourseListItem[];
  assignments: AssignmentListItem[];
  categories: FileCategory[];
  defaultCategory: FileCategory;
  uploadAction: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
}

export function FileUploader({ courses, assignments, categories, defaultCategory, uploadAction }: FileUploaderProps) {
  const [state, formAction] = useFormState(uploadAction, initialCourseBuilderActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state.success) return;
    formRef.current?.reset();
    router.refresh();
  }, [router, state.success]);

  return (
    <form ref={formRef} action={formAction} className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">File uploads</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Upload a file</h2>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="text-sm text-slate-300">
          Course
          <select name="courseId" className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40">
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Assignment
          <select name="assignmentId" className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40">
            <option value="">No assignment</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Category
          <select name="category" defaultValue={defaultCategory} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40">
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 block text-sm text-slate-300">
        File
        <input type="file" name="file" required className="mt-2 block w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:font-semibold file:text-slate-950" />
      </label>
      {state.error ? <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{state.error}</div> : null}
      {state.success && state.message ? <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{state.message}</div> : null}
      <div className="mt-4 flex justify-end">
        <AdminFormSubmitButton idleLabel="Upload file" loadingLabel="Uploading..." className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" />
      </div>
    </form>
  );
}