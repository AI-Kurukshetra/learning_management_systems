"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AddModuleModal } from "@/components/admin/AddModuleModal";
import { ModuleCard } from "@/components/admin/ModuleCard";
import { TemplateSelector } from "@/components/admin/TemplateSelector";
import type { CourseBuilderActionState, CourseTemplateKey } from "@/lib/course-builder";
import type { CourseListItem, CourseModuleItem } from "@/lib/types";

interface CourseBuilderProps {
  course: CourseListItem;
  initialModules: CourseModuleItem[];
  createModuleAction: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
  updateModuleAction: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
  deleteModuleAction: (payload: { courseId: string; moduleId: string }) => Promise<CourseBuilderActionState>;
  reorderModulesAction: (payload: {
    courseId: string;
    orderedModuleIds: string[];
  }) => Promise<CourseBuilderActionState>;
  applyTemplateAction: (payload: {
    courseId: string;
    templateKey: CourseTemplateKey;
  }) => Promise<CourseBuilderActionState>;
}

function moveModule(modules: CourseModuleItem[], draggedId: string, targetId: string): CourseModuleItem[] {
  const sourceIndex = modules.findIndex((module) => module.id === draggedId);
  const targetIndex = modules.findIndex((module) => module.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return modules;
  }

  const nextModules = [...modules];
  const [movedModule] = nextModules.splice(sourceIndex, 1);
  nextModules.splice(targetIndex, 0, movedModule);

  return nextModules.map((module, index) => ({
    ...module,
    position: index,
  }));
}

export function CourseBuilder({
  course,
  initialModules,
  createModuleAction,
  updateModuleAction,
  deleteModuleAction,
  reorderModulesAction,
  applyTemplateAction,
}: CourseBuilderProps) {
  const [modules, setModules] = useState(initialModules);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isReordering, startReorderTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setModules(initialModules);
  }, [initialModules]);

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDropTargetId(null);
      setDraggedId(null);
      return;
    }

    const previousModules = modules;
    const reorderedModules = moveModule(modules, draggedId, targetId);

    setModules(reorderedModules);
    setDropTargetId(null);
    setDraggedId(null);

    startReorderTransition(async () => {
      const result = await reorderModulesAction({
        courseId: course.id,
        orderedModuleIds: reorderedModules.map((module) => module.id),
      });

      if (result.success) {
        setFeedback({ type: "success", message: result.message ?? "Module order updated." });
        router.refresh();
        return;
      }

      setModules(previousModules);
      setFeedback({ type: "error", message: result.error ?? "Unable to update module order." });
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Course builder</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">{course.title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Build the curriculum with draggable modules. Teachers and students keep their existing course access while admins shape the learning flow here.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/courses" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Back to courses
            </Link>
            <AddModuleModal courseId={course.id} action={createModuleAction} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Teacher</p>
            <p className="mt-2 text-lg font-semibold text-white">{course.teacherName}</p>
            <p className="text-sm text-slate-400">{course.teacherEmail}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Students</p>
            <p className="mt-2 text-3xl font-semibold text-white">{course.studentCount}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Created</p>
            <p className="mt-2 text-lg font-semibold text-white">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(course.createdAt))}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Modules</p>
            <p className="mt-2 text-3xl font-semibold text-white">{modules.length}</p>
          </div>
        </div>
      </section>

      <TemplateSelector courseId={course.id} hasModules={modules.length > 0} action={applyTemplateAction} />

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Curriculum modules</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Draggable course structure</h2>
            <p className="mt-2 text-sm text-slate-400">Drag cards vertically to reorder the course. Each module can be edited, deleted, and mapped to a curriculum tag.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            {isReordering ? "Saving new order..." : "Order saves automatically after drop"}
          </span>
        </div>

        {feedback ? (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${feedback.type === "success" ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border border-rose-400/20 bg-rose-500/10 text-rose-100"}`}>
            {feedback.message}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {modules.length > 0 ? (
            modules.map((module) => (
              <ModuleCard
                key={module.id}
                courseId={course.id}
                module={module}
                isDragging={draggedId === module.id}
                isDropTarget={dropTargetId === module.id && draggedId !== module.id}
                onDragStart={(moduleId) => {
                  setDraggedId(moduleId);
                  setFeedback(null);
                }}
                onDragOver={(moduleId) => setDropTargetId(moduleId)}
                onDrop={handleDrop}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
                updateAction={updateModuleAction}
                deleteAction={deleteModuleAction}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/60 p-10 text-center">
              <p className="text-lg font-semibold text-white">No modules yet</p>
              <p className="mt-2 text-sm text-slate-400">Apply a template or add the first module to start structuring this course.</p>
              <div className="mt-6 flex justify-center">
                <AddModuleModal courseId={course.id} action={createModuleAction} />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
