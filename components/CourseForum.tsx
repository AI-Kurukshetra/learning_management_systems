"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { initialCourseBuilderActionState, type CourseBuilderActionState } from "@/lib/course-builder";
import { formatDateTimeDdMmYyyy } from "@/lib/date-format";
import type { AppUser, CourseForumMessageItem } from "@/lib/types";

interface CourseForumProps {
  courseId: string;
  currentUser: AppUser;
  messages: CourseForumMessageItem[];
  postMessageAction: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
}

export function CourseForum({
  courseId,
  currentUser,
  messages,
  postMessageAction,
}: CourseForumProps) {
  const [state, formAction] = useFormState(postMessageAction, initialCourseBuilderActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [router, state.success]);

  return (
    <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Course discussion</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Teacher and students forum</h2>
        <p className="mt-2 text-sm text-slate-400">Discuss questions, clarifications, and course updates inside this course.</p>
      </div>

      <div className="space-y-3">
        {messages.map((message) => {
          const isCurrentUser = message.senderId === currentUser.id;

          return (
            <article
              key={message.id}
              className={`rounded-3xl border px-4 py-4 ${
                isCurrentUser
                  ? "border-cyan-400/20 bg-cyan-500/10"
                  : "border-white/10 bg-slate-900/70"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{message.senderName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {message.senderRole} | {message.senderEmail}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {formatDateTimeDdMmYyyy(message.createdAt)}
                </span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{message.body}</p>
            </article>
          );
        })}

        {messages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 px-4 py-6 text-sm text-slate-400">
            No discussion messages yet.
          </div>
        ) : null}
      </div>

      <form ref={formRef} action={formAction} className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
        <input type="hidden" name="courseId" value={courseId} />
        <label className="block text-sm text-slate-300">
          Add message
          <textarea
            name="body"
            required
            rows={4}
            placeholder="Post a question, clarification, or update for this course..."
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
          />
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
        <AdminFormSubmitButton
          idleLabel="Send message"
          loadingLabel="Sending..."
          className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
        />
      </form>
    </section>
  );
}