"use client";

import { useState } from "react";

interface CreateCourseModalProps {
  teacherId: string;
  role: "teacher" | "student";
  userId: string;
  action: (formData: FormData) => void;
}

export function CreateCourseModal({ teacherId, role, userId, action }: CreateCourseModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        Create course
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">New course</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Launch a new learning space</h3>
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
              <input type="hidden" name="teacherId" value={teacherId} />
              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="redirectPath" value="/courses" />
              <label className="block text-sm text-slate-300">
                Course title
                <input
                  name="title"
                  required
                  placeholder="Advanced Biology"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                />
              </label>
              <button className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
                Save course
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

