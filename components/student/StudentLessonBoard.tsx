import { getCourseModuleTypeLabel } from "@/lib/course-builder";
import { formatDateDdMmYyyy } from "@/lib/date-format";
import type { CourseModuleItem, CourseStudentGradeItem } from "@/lib/types";

export function StudentLessonBoard({
  modules,
  courseGrade,
}: {
  modules: CourseModuleItem[];
  courseGrade: CourseStudentGradeItem | null;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Course grade</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Teacher evaluation</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-[180px,1fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Grade</p>
            <p className="mt-3 text-4xl font-semibold text-white">{courseGrade?.grade ?? "-"}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Comments</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{courseGrade?.comments ?? "No comments posted yet."}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Lesson tasks</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Course roadmap</h2>
          <p className="mt-2 text-sm text-slate-400">Review each lesson, follow the assigned tasks, and watch the due dates.</p>
        </div>

        {modules.map((module) => (
          <article key={module.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Module {module.position + 1}</span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-cyan-200">{getCourseModuleTypeLabel(module.moduleType)}</span>
              {module.curriculumTag ? <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-100">{module.curriculumTag}</span> : null}
              <span className={`rounded-full px-3 py-1 ${module.isCompleted ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border border-amber-400/20 bg-amber-500/10 text-amber-100"}`}>
                {module.isCompleted ? "Lesson completed by teacher" : "Active lesson"}
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-white">{module.title}</h3>
            {module.description ? <p className="mt-2 text-sm text-slate-400">{module.description}</p> : null}
            <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
              <p className="whitespace-pre-wrap leading-6">{module.content || "No lesson content added yet."}</p>
            </div>
            <div className="mt-5 space-y-3">
              {module.tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-semibold text-cyan-200">{task.position + 1}</span>
                      {task.title}
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {task.dueDate ? `Due ${formatDateDdMmYyyy(task.dueDate)}` : "No due date"}
                    </span>
                  </div>
                </div>
              ))}
              {module.tasks.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 px-4 py-5 text-sm text-slate-400">No tasks assigned in this module.</div> : null}
            </div>
          </article>
        ))}

        {modules.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">No curriculum modules are available for this course yet.</div> : null}
      </section>
    </div>
  );
}