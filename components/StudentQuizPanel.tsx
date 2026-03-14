"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitQuiz } from "@/lib/quiz-actions";
import type { QuizItem } from "@/lib/types";

export function StudentQuizPanel({ quizzes }: { quizzes: QuizItem[] }) {
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <section className="space-y-4">
      {quizzes.map((quiz) => (
        <form id={`quiz-${quiz.id}`} key={quiz.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">{quiz.courseTitle}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{quiz.title}</h2>
            </div>
            {quiz.submission ? <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200">Submitted · {quiz.submission.score}/{quiz.questionCount}</span> : null}
          </div>
          {quiz.description ? <p className="mt-3 text-sm text-slate-400">{quiz.description}</p> : null}
          <div className="mt-5 space-y-4">
            {quiz.questions.map((question, index) => (
              <div key={question.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="font-medium text-white">{index + 1}. {question.prompt}</p>
                <div className="mt-3 space-y-2">
                  {question.questionType === "multiple_choice" || question.questionType === "true_false" ? (
                    question.options.map((option) => (
                      <label key={option} className="flex items-center gap-3 text-sm text-slate-300">
                        <input type="radio" name={question.id} value={option} defaultChecked={quiz.submission?.answers?.[question.id] === option} className="h-4 w-4" />
                        <span>{option}</span>
                      </label>
                    ))
                  ) : (
                    <input name={question.id} defaultValue={quiz.submission?.answers?.[question.id] ?? ""} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-400">Due {quiz.dueAt ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(quiz.dueAt)) : "Any time"}</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                const browserForm = new FormData(document.getElementById(`quiz-${quiz.id}`) as HTMLFormElement);
                const answers: Record<string, string> = {};
                quiz.questions.forEach((question) => {
                  answers[question.id] = String(browserForm.get(question.id) ?? "");
                });
                const payload = new FormData();
                payload.set("quizId", quiz.id);
                payload.set("answersPayload", JSON.stringify(answers));
                startTransition(async () => {
                  const result = await submitQuiz({ success: false, error: null, message: null }, payload);
                  setMessages((current) => ({ ...current, [quiz.id]: result.error ?? result.message ?? "Updated." }));
                  router.refresh();
                });
              }}
              className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-70"
            >
              {pending ? "Submitting..." : quiz.submission ? "Update quiz" : "Submit quiz"}
            </button>
          </div>
          {messages[quiz.id] ? <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">{messages[quiz.id]}</div> : null}
        </form>
      ))}
      {quizzes.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">No quizzes are available yet.</div> : null}
    </section>
  );
}