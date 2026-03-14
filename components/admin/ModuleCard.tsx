"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import {
  COURSE_MODULE_TYPES,
  CURRICULUM_TAGS,
  getCourseModuleTypeLabel,
  initialCourseBuilderActionState,
  type CourseBuilderActionState,
} from "@/lib/course-builder";
import type { CourseModuleItem } from "@/lib/types";

interface ModuleCardProps {
  courseId: string;
  module: CourseModuleItem;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (moduleId: string) => void;
  onDragOver: (moduleId: string) => void;
  onDrop: (moduleId: string) => void;
  onDragEnd: () => void;
  updateAction: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
  deleteAction: (payload: { courseId: string; moduleId: string }) => Promise<CourseBuilderActionState>;
}

export function ModuleCard({
  courseId,
  module,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  updateAction,
  deleteAction,
}: ModuleCardProps) {
  const [editing, setEditing] = useState(false);
  const [deleteState, setDeleteState] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [state, formAction] = useFormState(updateAction, initialCourseBuilderActionState);
  const router = useRouter();

  useEffect(() => {
    if (!state.success) {
      return;
    }

    setEditing(false);
    router.refresh();
  }, [router, state.success]);

  const previewText = useMemo(() => {
    if (module.content.trim()) {
      return module.content.trim();
    }

    if (module.description.trim()) {
      return module.description.trim();
    }

    return "No content added yet.";
  }, [module.content, module.description]);

  const handleDelete = () => {
    if (!window.confirm(`Delete \"${module.title}\" from this course?`)) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteAction({ courseId, moduleId: module.id });

      if (result.success) {
        setDeleteState({ type: "success", message: result.message ?? "Module deleted." });
        router.refresh();
        return;
      }

      setDeleteState({ type: "error", message: result.error ?? "Unable to delete module." });
    });
  };

  return (
    <article
      draggable
      onDragStart={() => onDragStart(module.id)}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(module.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(module.id);
      }}
      onDragEnd={onDragEnd}
      className={`rounded-3xl border p-5 transition ${
        isDragging
          ? "border-cyan-400/50 bg-cyan-500/10 opacity-70"
          : isDropTarget
            ? "border-cyan-300/70 bg-cyan-500/5"
            : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{module.title}</h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">{previewText}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="cursor-grab rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 active:cursor-grabbing">
            Drag to reorder
          </span>
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
          >
            {editing ? "Close" : "Edit"}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              />
            ) : null}
            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </div>

      {editing ? (
        <form action={formAction} className="mt-6 grid gap-4">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="moduleId" value={module.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-300">
              Title
              <input
                name="title"
                defaultValue={module.title}
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
              />
            </label>
            <label className="text-sm text-slate-300">
              Module type
              <select
                name="moduleType"
                defaultValue={module.moduleType}
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
              defaultValue={module.description}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
            />
          </label>

          <label className="text-sm text-slate-300">
            Content
            <textarea
              name="content"
              rows={6}
              defaultValue={module.content}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
            />
          </label>

          <label className="text-sm text-slate-300">
            Curriculum tag
            <select
              name="curriculumTag"
              defaultValue={module.curriculumTag ?? ""}
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
          {state.success && state.message ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {state.message}
            </div>
          ) : null}
          {deleteState ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                deleteState.type === "success"
                  ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                  : "border border-rose-400/20 bg-rose-500/10 text-rose-100"
              }`}
            >
              {deleteState.message}
            </div>
          ) : null}

          <div className="flex justify-end">
            <AdminFormSubmitButton
              idleLabel="Save changes"
              loadingLabel="Saving changes..."
              className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            />
          </div>
        </form>
      ) : deleteState ? (
        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            deleteState.type === "success"
              ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
              : "border border-rose-400/20 bg-rose-500/10 text-rose-100"
          }`}
        >
          {deleteState.message}
        </div>
      ) : null}
    </article>
  );
}
