import { AppShell } from "@/components/AppShell";
import { QuizBuilder } from "@/components/QuizBuilder";
import { getCourses, getCurrentViewer } from "@/lib/dbActions";
import { createQuiz, getQuizzes } from "@/lib/quiz-actions";

export const dynamic = "force-dynamic";

export default async function TeacherQuizzesPage() {
  const viewer = await getCurrentViewer();
  const [courses, quizzes] = await Promise.all([getCourses(viewer), getQuizzes()]);

  return (
    <AppShell title="Quiz Builder" description="Create auto-scored quizzes and review the published quiz set across your courses." viewer={viewer}>
      <div className="grid gap-8 xl:grid-cols-[520px,1fr]">
        <QuizBuilder courses={courses} createQuizAction={createQuiz} />
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Published quizzes</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Current quiz catalog</h2>
          </div>
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">{quiz.courseTitle}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{quiz.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{quiz.description || "No description."}</p>
              <p className="mt-4 text-sm text-slate-300">{quiz.questionCount} questions</p>
            </div>
          ))}
          {quizzes.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">No quizzes created yet.</div> : null}
        </section>
      </div>
    </AppShell>
  );
}