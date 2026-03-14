"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import {
  getCourseModuleTypeLabel,
  initialCourseBuilderActionState,
  type CourseBuilderActionState,
} from "@/lib/course-builder";
import { formatDateDdMmYyyy } from "@/lib/date-format";
import type { CourseModuleItem } from "@/lib/types";

interface TeacherLessonBoardProps {
  courseId: string;
  modules: CourseModuleItem[];
  addTaskAction: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
  toggleLessonCompletionAction: (payload: {
    courseId: string;
    moduleId: string;
  }) => Promise<CourseBuilderActionState>;
}

interface TeacherLessonCardProps {
  courseId: string;
  module: CourseModuleItem;
  addTaskAction: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
  toggleLessonCompletionAction: (payload: {
    courseId: string;
    moduleId: string;
  }) => Promise<CourseBuilderActionState>;
}

function TeacherLessonCard({
  courseId,
  module,
  addTaskAction,
  toggleLessonCompletionAction,
}: TeacherLessonCardProps) {
  const [state, formAction] = useFormState(addTaskAction, initialCourseBuilderActionState);
  const [toggleState, setToggleState] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isToggling, startToggleTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const isLesson = module.moduleType === "lesson";

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [router, state.success]);

  const handleToggleLesson = () => {
    startToggleTransition(async () => {
      const result = await toggleLessonCompletionAction({ courseId, moduleId: module.id });

      if (result.success) {
        setToggleState({ type: "success", message: result.message ?? "Lesson updated." });
        router.refresh();
        return;
      }

      setToggleState({ type: "error", message: result.error ?? "Unable to update lesson." });
    });
  };

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Module {module.position + 1}</span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-cyan-200">
              {getCourseModuleTypeLabel(module.moduleType)}
            </span>
            {module.curriculumTag ? (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                {module.curriculumTag}
              </span>
            ) : null}
            {isLesson ? (
              <span
                className={`rounded-full px-3 py-1 ${
                  module.isCompleted
                    ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                    : "border border-amber-400/20 bg-amber-500/10 text-amber-100"
                }`}
              >
                {module.isCompleted ? "Completed" : "In progress"}
              </span>
            ) : null}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">{module.title}</h2>
            {module.description ? <p className="mt-2 text-sm text-slate-400">{module.description}</p> : null}
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
            <p className="whitespace-pre-wrap leading-6 text-slate-300">{module.content || "No lesson content added yet."}</p>
          </div>
        </div>

        {isLesson ? (
          <button
            type="button"
            disabled={isToggling}
            onClick={handleToggleLesson}
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isToggling ? (
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            ) : null}
            <span>{isToggling ? "Updating..." : module.isCompleted ? "Reopen lesson" : "Complete lesson"}</span>
          </button>
        ) : null}
      </div>

      {toggleState ? (
        <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${toggleState.type === "success" ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border border-rose-400/20 bg-rose-500/10 text-rose-100"}`}>
          {toggleState.message}
        </div>
      ) : null}

      {isLesson ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr,0.95fr]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Lesson tasks</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{module.tasks.length} tasks</span>
            </div>
            <div className="mt-4 space-y-3">
              {module.tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-semibold text-cyan-200">{task.position + 1}</span>
                      {task.title}
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {formatDateDdMmYyyy(task.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
              {module.tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 px-4 py-5 text-sm text-slate-400">No lesson tasks yet.</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Add task</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Plan lesson delivery</h3>
            <form ref={formRef} action={formAction} className="mt-5 space-y-4">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="moduleId" value={module.id} />
              <input
                name="title"
                required
                placeholder="Review warm-up questions"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
              />
              <label className="block text-sm text-slate-300">
                Due date
                <input
                  type="date"
                  name="dueDate"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                />
              </label>
              {state.error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{state.error}</div> : null}
              {state.success && state.message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{state.message}</div> : null}
              <AdminFormSubmitButton
                idleLabel="Add lesson task"
                loadingLabel="Adding task..."
                className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              />
            </form>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function TeacherLessonBoard({ courseId, modules, addTaskAction, toggleLessonCompletionAction }: TeacherLessonBoardProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Lesson delivery</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Course curriculum</h2>
          <p className="mt-2 text-sm text-slate-400">Track lesson progress, assign dated lesson tasks, and complete lessons as you move through the course.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{modules.length} modules</span>
      </div>

      {modules.map((module) => (
        <TeacherLessonCard
          key={module.id}
          courseId={courseId}
          module={module}
          addTaskAction={addTaskAction}
          toggleLessonCompletionAction={toggleLessonCompletionAction}
        />
      ))}

      {modules.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">No curriculum modules are available for this course yet.</div>
      ) : null}
    </section>
  );
}