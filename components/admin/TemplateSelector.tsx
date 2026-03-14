"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { COURSE_TEMPLATES, type CourseTemplateKey } from "@/lib/course-builder";

interface TemplateSelectorProps {
  courseId: string;
  hasModules: boolean;
  action: (payload: {
    courseId: string;
    templateKey: CourseTemplateKey;
  }) => Promise<{
    success: boolean;
    error: string | null;
    message: string | null;
  }>;
}

export function TemplateSelector({ courseId, hasModules, action }: TemplateSelectorProps) {
  const [pending, startTransition] = useTransition();
  const [activeTemplateKey, setActiveTemplateKey] = useState<CourseTemplateKey | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const router = useRouter();

  const handleApplyTemplate = (templateKey: CourseTemplateKey, label: string) => {
    if (
      hasModules &&
      !window.confirm(`Apply ${label}? This will replace the current course modules.`)
    ) {
      return;
    }

    setActiveTemplateKey(templateKey);

    startTransition(async () => {
      const result = await action({ courseId, templateKey });

      if (result.success) {
        setFeedback({ type: "success", message: result.message ?? "Template applied." });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result.error ?? "Unable to apply template." });
      }

      setActiveTemplateKey(null);
    });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Templates</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start from a curriculum template</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Choose a starter structure for this course. Templates create default modules that can be edited, reordered, or deleted afterward.
          </p>
        </div>
        <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
          {hasModules ? "Applying a template replaces current modules" : "Template will create starter modules"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {COURSE_TEMPLATES.map((template) => {
          const isActive = pending && activeTemplateKey === template.key;

          return (
            <div key={template.key} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold text-white">{template.label}</p>
              <p className="mt-2 text-sm text-slate-400">{template.description}</p>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleApplyTemplate(template.key, template.label)}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                  />
                ) : null}
                <span>{isActive ? "Applying..." : "Apply template"}</span>
              </button>
            </div>
          );
        })}
      </div>

      {feedback ? (
        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
              : "border border-rose-400/20 bg-rose-500/10 text-rose-100"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
    </section>
  );
}
