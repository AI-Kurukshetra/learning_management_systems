"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { initialCourseBuilderActionState, type CourseBuilderActionState } from "@/lib/course-builder";
import type { CourseListItem, QuizQuestionType } from "@/lib/types";

interface QuestionDraft {
  id: string;
  questionType: QuizQuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

interface QuizBuilderProps {
  courses: CourseListItem[];
  createQuizAction: (
    state: CourseBuilderActionState,
    formData: FormData,
  ) => Promise<CourseBuilderActionState>;
}

function makeQuestion(): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    questionType: "multiple_choice",
    prompt: "",
    options: ["", "", "", ""],
    correctAnswer: "",
  };
}

export function QuizBuilder({ courses, createQuizAction }: QuizBuilderProps) {
  const [state, formAction] = useFormState(createQuizAction, initialCourseBuilderActionState);
  const [questions, setQuestions] = useState<QuestionDraft[]>([makeQuestion()]);
  const router = useRouter();

  useEffect(() => {
    if (!state.success) {
      return;
    }

    setQuestions([makeQuestion()]);
    router.refresh();
  }, [router, state.success]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Quiz builder</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Create a course quiz</h2>
      </div>

      <form action={formAction} className="mt-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Course
            <select name="courseId" className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40">
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-300">
            Due date
            <input type="datetime-local" name="dueAt" className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40" />
          </label>
        </div>
        <label className="block text-sm text-slate-300">
          Title
          <input name="title" required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40" />
        </label>
        <label className="block text-sm text-slate-300">
          Description
          <textarea name="description" rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40" />
        </label>

        <input type="hidden" name="questionsPayload" value={JSON.stringify(questions.map(({ id, ...question }) => question))} />

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-white">Question {index + 1}</p>
                {questions.length > 1 ? (
                  <button type="button" onClick={() => setQuestions((items) => items.filter((item) => item.id !== question.id))} className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10">
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Type
                  <select
                    value={question.questionType}
                    onChange={(event) => {
                      const nextType = event.target.value as QuizQuestionType;
                      setQuestions((items) => items.map((item) => item.id === question.id ? { ...item, questionType: nextType, options: nextType === "multiple_choice" ? ["", "", "", ""] : nextType === "true_false" ? ["True", "False"] : [], correctAnswer: "" } : item));
                    }}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                  >
                    <option value="multiple_choice">Multiple choice</option>
                    <option value="short_answer">Short answer</option>
                    <option value="true_false">True or false</option>
                  </select>
                </label>
                <label className="text-sm text-slate-300">
                  Correct answer
                  <input
                    value={question.correctAnswer}
                    onChange={(event) => setQuestions((items) => items.map((item) => item.id === question.id ? { ...item, correctAnswer: event.target.value } : item))}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                  />
                </label>
              </div>
              <label className="mt-4 block text-sm text-slate-300">
                Prompt
                <textarea
                  value={question.prompt}
                  onChange={(event) => setQuestions((items) => items.map((item) => item.id === question.id ? { ...item, prompt: event.target.value } : item))}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                />
              </label>
              {question.questionType === "multiple_choice" ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={`${question.id}-${optionIndex}`} className="text-sm text-slate-300">
                      Option {optionIndex + 1}
                      <input
                        value={option}
                        onChange={(event) => setQuestions((items) => items.map((item) => item.id === question.id ? { ...item, options: item.options.map((entry, indexValue) => indexValue === optionIndex ? event.target.value : entry) } : item))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                      />
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setQuestions((items) => [...items, makeQuestion()])} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
            Add question
          </button>
          <AdminFormSubmitButton idleLabel="Create quiz" loadingLabel="Creating..." className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" />
        </div>
        {state.error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{state.error}</div> : null}
        {state.success && state.message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{state.message}</div> : null}
      </form>
    </section>
  );
}