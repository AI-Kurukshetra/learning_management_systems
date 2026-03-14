"use server";

import { requireAuthenticatedViewer } from "@/lib/auth";
import type { CourseBuilderActionState } from "@/lib/course-builder";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import {
  assertCourseAccess,
  fail,
  getAccessibleCourses,
  normalizeText,
  normalizeValue,
  ok,
  optionalText,
  revalidateCourseMembers,
  revalidateWorkspace,
  toSchemaAwareMessage,
  type CourseRow,
} from "@/lib/lms-common";
import type { QuizItem, QuizQuestionItem, QuizQuestionType, QuizSubmissionItem } from "@/lib/types";

interface QuizRow {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description: string;
  due_at: string | null;
  created_at: string;
}

interface QuestionRow {
  id: string;
  quiz_id: string;
  question_type: QuizQuestionType;
  prompt: string;
  options: string[];
  correct_answer: string;
  position: number;
}

interface QuizSubmissionRow {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: Record<string, string>;
  score: number;
  submitted_at: string;
}

function mapQuestion(row: QuestionRow): QuizQuestionItem {
  return {
    id: row.id,
    quizId: row.quiz_id,
    questionType: row.question_type,
    prompt: row.prompt,
    options: Array.isArray(row.options) ? row.options : [],
    correctAnswer: row.correct_answer,
    position: row.position,
  };
}

function mapSubmission(row: QuizSubmissionRow): QuizSubmissionItem {
  return {
    id: row.id,
    quizId: row.quiz_id,
    studentId: row.student_id,
    answers: row.answers ?? {},
    score: row.score,
    submittedAt: row.submitted_at,
  };
}

export async function createQuiz(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const courseId = normalizeText(formData.get("courseId"), "Course");
    const { viewer, supabase } = await assertCourseAccess(courseId, ["admin", "teacher"]);
    const title = normalizeText(formData.get("title"), "Quiz title");
    const description = optionalText(formData.get("description")) ?? "";
    const dueAtInput = optionalText(formData.get("dueAt"));
    const questionsPayload = normalizeText(formData.get("questionsPayload"), "Questions");
    const parsedQuestions = JSON.parse(questionsPayload) as Array<{ questionType: QuizQuestionType; prompt: string; options: string[]; correctAnswer: string }>;

    if (parsedQuestions.length === 0) {
      throw new Error("Add at least one question.");
    }

    const quizInsert = await supabase
      .from("quizzes")
      .insert({
        course_id: courseId,
        teacher_id: viewer.currentUser.id,
        title,
        description,
        due_at: dueAtInput ? new Date(dueAtInput).toISOString() : null,
      })
      .select("id")
      .single();
    if (quizInsert.error) throw new Error(quizInsert.error.message);

    const { error: questionError } = await supabase.from("questions").insert(
      parsedQuestions.map((question, index) => ({
        quiz_id: quizInsert.data.id,
        question_type: question.questionType,
        prompt: question.prompt.trim(),
        options: question.questionType === "multiple_choice" ? question.options.filter(Boolean) : question.questionType === "true_false" ? ["True", "False"] : [],
        correct_answer: question.correctAnswer.trim(),
        position: index,
      })),
    );
    if (questionError) throw new Error(questionError.message);

    revalidateWorkspace(viewer.role);
    revalidateCourseMembers(courseId);
    return ok("Quiz created.");
  } catch (error) {
    return fail(toSchemaAwareMessage(error));
  }
}

export async function getQuizzes({ courseId }: { courseId?: string } = {}) {
  const viewer = await requireAuthenticatedViewer();
  const supabase = createServiceRoleSupabaseClient();
  const courses = await getAccessibleCourses(viewer, courseId);
  if (courses.length === 0) return [] as QuizItem[];

  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const quizResult = await supabase
    .from("quizzes")
    .select("id,course_id,teacher_id,title,description,due_at,created_at")
    .in("course_id", courses.map((course) => course.id))
    .order("created_at", { ascending: false });
  if (quizResult.error) return [] as QuizItem[];

  const quizzes = (quizResult.data ?? []) as QuizRow[];
  const quizIds = quizzes.map((quiz) => quiz.id);
  const [questionResult, submissionResult] = await Promise.all([
    quizIds.length > 0 ? supabase.from("questions").select("id,quiz_id,question_type,prompt,options,correct_answer,position").in("quiz_id", quizIds).order("position", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    viewer.role === "student" && quizIds.length > 0 ? supabase.from("quiz_submissions").select("id,quiz_id,student_id,answers,score,submitted_at").in("quiz_id", quizIds).eq("student_id", viewer.currentUser.id) : Promise.resolve({ data: [], error: null }),
  ]);
  if (questionResult.error || submissionResult.error) return [] as QuizItem[];

  const questionsByQuiz = new Map<string, QuizQuestionItem[]>();
  ((questionResult.data ?? []) as QuestionRow[]).forEach((row) => {
    const list = questionsByQuiz.get(row.quiz_id) ?? [];
    list.push(mapQuestion(row));
    questionsByQuiz.set(row.quiz_id, list);
  });
  const submissionByQuiz = new Map<string, QuizSubmissionItem>();
  ((submissionResult.data ?? []) as QuizSubmissionRow[]).forEach((row) => submissionByQuiz.set(row.quiz_id, mapSubmission(row)));

  return quizzes.map<QuizItem>((quiz) => ({
    id: quiz.id,
    courseId: quiz.course_id,
    courseTitle: courseMap.get(quiz.course_id)?.title ?? "Unknown course",
    teacherId: quiz.teacher_id,
    title: quiz.title,
    description: quiz.description,
    dueAt: quiz.due_at,
    createdAt: quiz.created_at,
    questionCount: questionsByQuiz.get(quiz.id)?.length ?? 0,
    questions: questionsByQuiz.get(quiz.id) ?? [],
    submission: submissionByQuiz.get(quiz.id) ?? null,
  }));
}

export async function getQuiz(quizId: string) {
  const viewer = await requireAuthenticatedViewer();
  const supabase = createServiceRoleSupabaseClient();
  const { data: quizRow, error } = await supabase.from("quizzes").select("id,course_id,teacher_id,title,description,due_at,created_at").eq("id", quizId).maybeSingle();
  if (error || !quizRow) return null;
  const courses = await getAccessibleCourses(viewer, quizRow.course_id);
  if (courses.length === 0) return null;

  const [questionResult, submissionResult] = await Promise.all([
    supabase.from("questions").select("id,quiz_id,question_type,prompt,options,correct_answer,position").eq("quiz_id", quizId).order("position", { ascending: true }),
    viewer.role === "student" ? supabase.from("quiz_submissions").select("id,quiz_id,student_id,answers,score,submitted_at").eq("quiz_id", quizId).eq("student_id", viewer.currentUser.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (questionResult.error || submissionResult.error) return null;

  return {
    id: quizRow.id,
    courseId: quizRow.course_id,
    courseTitle: courses[0].title,
    teacherId: quizRow.teacher_id,
    title: quizRow.title,
    description: quizRow.description,
    dueAt: quizRow.due_at,
    createdAt: quizRow.created_at,
    questionCount: (questionResult.data ?? []).length,
    questions: ((questionResult.data ?? []) as QuestionRow[]).map(mapQuestion),
    submission: submissionResult.data ? mapSubmission(submissionResult.data as QuizSubmissionRow) : null,
  } as QuizItem;
}

export async function submitQuiz(
  _state: CourseBuilderActionState,
  formData: FormData,
): Promise<CourseBuilderActionState> {
  try {
    const viewer = await requireAuthenticatedViewer(["student"]);
    const quizId = normalizeText(formData.get("quizId"), "Quiz");
    const answersPayload = normalizeText(formData.get("answersPayload"), "Answers");
    const quiz = await getQuiz(quizId);
    if (!quiz) throw new Error("Quiz not found.");

    const answers = JSON.parse(answersPayload) as Record<string, string>;
    let score = 0;
    quiz.questions.forEach((question) => {
      if (normalizeValue(answers[question.id]) === normalizeValue(question.correctAnswer)) score += 1;
    });

    const supabase = createServiceRoleSupabaseClient();
    const { error } = await supabase.from("quiz_submissions").upsert(
      {
        quiz_id: quizId,
        student_id: viewer.currentUser.id,
        answers,
        score,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "quiz_id,student_id" },
    );
    if (error) throw new Error(error.message);

    revalidateWorkspace(viewer.role);
    return ok(`Quiz submitted. Score: ${score}/${quiz.questions.length}.`);
  } catch (error) {
    return fail(toSchemaAwareMessage(error));
  }
}