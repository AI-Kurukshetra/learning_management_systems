import { AppShell } from "@/components/AppShell";
import { StudentQuizPanel } from "@/components/StudentQuizPanel";
import { getCurrentViewer } from "@/lib/dbActions";
import { getQuizzes } from "@/lib/quiz-actions";

export const dynamic = "force-dynamic";

export default async function StudentQuizzesPage() {
  const viewer = await getCurrentViewer();
  const quizzes = await getQuizzes();

  return (
    <AppShell title="Quizzes" description="Participate in quizzes and review your latest automatic scores." viewer={viewer}>
      <StudentQuizPanel quizzes={quizzes} />
    </AppShell>
  );
}