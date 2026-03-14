"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { initialCourseBuilderActionState, type CourseBuilderActionState } from "@/lib/course-builder";
import type { AppUser, MessageItem, MessageThreadItem } from "@/lib/types";

interface MessagingPanelProps {
  recipients: AppUser[];
  threads: MessageThreadItem[];
  messages: MessageItem[];
  selectedRecipientId: string | null;
  createMessageAction: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
}

export function MessagingPanel({ recipients, threads, messages, selectedRecipientId, createMessageAction }: MessagingPanelProps) {
  const [state, formAction] = useFormState(createMessageAction, initialCourseBuilderActionState);
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
    <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
      <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold text-white">Conversations</h2>
        <div className="mt-4 space-y-3">
          {threads.map((thread) => (
            <a
              key={thread.userId}
              href={`?with=${thread.userId}`}
              className={`block rounded-2xl border px-4 py-3 ${selectedRecipientId === thread.userId ? "border-cyan-400/20 bg-cyan-500/10" : "border-white/10 bg-slate-900/70"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-white">{thread.userName}</p>
                {thread.unreadCount > 0 ? <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-xs font-semibold text-slate-950">{thread.unreadCount}</span> : null}
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{thread.userRole}</p>
              <p className="mt-3 line-clamp-2 text-sm text-slate-300">{thread.lastMessage}</p>
            </a>
          ))}
          {threads.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No conversations yet.</div> : null}
        </div>
      </aside>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Internal messaging</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Inbox</h2>
        </div>

        <div className="space-y-3">
          {messages.map((message) => (
            <article key={message.id} className={`rounded-2xl border px-4 py-3 ${selectedRecipientId && message.senderId !== selectedRecipientId ? "border-white/10 bg-white/5" : "border-cyan-400/20 bg-slate-900/70"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{message.subject || "Message"}</p>
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{message.senderName} to {message.recipientName}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{message.body}</p>
            </article>
          ))}
          {messages.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Select a conversation or start a new message.</div> : null}
        </div>

        <form ref={formRef} action={formAction} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-300">
              Recipient
              <select name="recipientId" defaultValue={selectedRecipientId ?? ""} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40">
                <option value="">Select recipient</option>
                {recipients.map((recipient) => (
                  <option key={recipient.id} value={recipient.id}>{recipient.name} ({recipient.role})</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Subject
              <input name="subject" placeholder="Question about attendance" className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40" />
            </label>
          </div>
          <label className="mt-4 block text-sm text-slate-300">
            Message
            <textarea name="body" rows={5} required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40" />
          </label>
          {state.error ? <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{state.error}</div> : null}
          {state.success && state.message ? <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{state.message}</div> : null}
          <div className="mt-4 flex justify-end">
            <AdminFormSubmitButton idleLabel="Send message" loadingLabel="Sending..." className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" />
          </div>
        </form>
      </section>
    </div>
  );
}