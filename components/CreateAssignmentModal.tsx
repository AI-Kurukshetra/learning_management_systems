"use client";

import { useState } from "react";

interface CreateAssignmentModalProps {
  courseId: string;
  redirectPath: string;
  action: (formData: FormData) => void;
}

export function CreateAssignmentModal({
  courseId,
  redirectPath,
  action,
}: CreateAssignmentModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
      >
        Create assignment
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">New assignment</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Publish work for the class</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-300"
              >
                Close
              </button>
            </div>
            <form action={action} className="mt-6 space-y-4">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="redirectPath" value={redirectPath} />
              <label className="block text-sm text-slate-300">
                Title
                <input
                  name="title"
                  required
                  placeholder="Case study analysis"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Description
                <textarea
                  name="description"
                  required
                  rows={5}
                  placeholder="Summarize the key findings and support your position with evidence."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Due date
                <input
                  type="datetime-local"
                  name="dueDate"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                />
              </label>
              <button className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
                Publish assignment
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
