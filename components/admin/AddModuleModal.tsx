"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import {
  COURSE_MODULE_TYPES,
  CURRICULUM_TAGS,
  initialCourseBuilderActionState,
  type CourseBuilderActionState,
} from "@/lib/course-builder";

interface AddModuleModalProps {
  courseId: string;
  action: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
}

export function AddModuleModal({ courseId, action }: AddModuleModalProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(action, initialCourseBuilderActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    setOpen(false);
    router.refresh();
  }, [router, state.success]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        Add module
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-cyan-950/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Course builder</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Add module</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Add a new curriculum block to the selected course structure.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>

            <form ref={formRef} action={formAction} className="mt-6 space-y-4">
              <input type="hidden" name="courseId" value={courseId} />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Title
                  <input
                    name="title"
                    required
                    placeholder="Lesson 3"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                  />
                </label>
                <label className="text-sm text-slate-300">
                  Module type
                  <select
                    name="moduleType"
                    defaultValue="lesson"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                  >
                    {COURSE_MODULE_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="text-sm text-slate-300">
                Description
                <textarea
                  name="description"
                  rows={3}
                  placeholder="What should this module cover?"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                />
              </label>

              <label className="text-sm text-slate-300">
                Content
                <textarea
                  name="content"
                  rows={5}
                  placeholder="Add lesson notes, video links, instructions, or resource content."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                />
              </label>

              <label className="text-sm text-slate-300">
                Curriculum tag
                <select
                  name="curriculumTag"
                  defaultValue=""
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                >
                  <option value="">No tag</option>
                  {CURRICULUM_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </label>

              {state.error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {state.error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <AdminFormSubmitButton
                  idleLabel="Save module"
                  loadingLabel="Saving module..."
                  className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
