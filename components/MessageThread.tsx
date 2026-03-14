"use client";

import { useFormState } from "react-dom";
import { useEffect, useRef } from "react";
import { formatDateTimeDdMmYyyy } from "@/lib/date-format";
import type { ParentMessageActionState } from "@/lib/parent-actions";
import type { ParentMessageItem, ParentTeacherContact } from "@/lib/types";

interface MessageThreadProps {
  contacts: ParentTeacherContact[];
  messages: ParentMessageItem[];
  action: (
    state: ParentMessageActionState,
    formData: FormData,
  ) => Promise<ParentMessageActionState>;
  initialState: ParentMessageActionState;
}

export function MessageThread({ contacts, messages, action, initialState }: MessageThreadProps) {
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
  }, [state.success]);

  return (
    <section className="grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Message teacher</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Start a conversation</h2>
        <form ref={formRef} action={formAction} className="mt-6 space-y-4">
          <label className="block text-sm text-slate-300">
            Teacher
            <select
              name="teacherId"
              defaultValue=""
              disabled={contacts.length === 0}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40 disabled:opacity-60"
            >
              <option value="">Select teacher</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} ({contact.email})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            Message
            <textarea
              name="content"
              rows={6}
              placeholder="Write a note for the teacher"
              disabled={contacts.length === 0}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40 disabled:opacity-60"
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
          <button
            type="submit"
            disabled={contacts.length === 0}
            className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send message
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Thread history</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Recent teacher communication</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {messages.length} messages
          </span>
        </div>
        <div className="mt-6 space-y-4">
          {messages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">To {message.teacherName}</p>
                  <p className="text-sm text-slate-400">{formatDateTimeDdMmYyyy(message.timestamp)}</p>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                  Parent message
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-200">{message.content}</p>
            </article>
          ))}
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
              No messages sent yet.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
