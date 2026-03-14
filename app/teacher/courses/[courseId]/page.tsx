import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CourseForum } from "@/components/CourseForum";
import { StudentList } from "@/components/StudentList";
import { TeacherCourseGradesPanel } from "@/components/teacher/TeacherCourseGradesPanel";
import { TeacherLessonBoard } from "@/components/teacher/TeacherLessonBoard";
import {
  courseModulesSchemaMismatchMessage,
  isCourseModulesSchemaMismatchError,
} from "@/lib/auth-errors";
import { getCourseForumMessages, postCourseMessage } from "@/lib/course-forum-actions";
import { getCourseById, getCurrentViewer, getUsersByRole } from "@/lib/dbActions";
import {
  addLessonTask,
  getTeacherCourseGrades,
  getTeacherCourseModules,
  saveCourseGrade,
  toggleLessonCompletion,
} from "@/lib/teacher-course-actions";
import type { CourseForumMessageItem, CourseModuleItem, CourseStudentGradeItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeacherCourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const viewer = await getCurrentViewer();
  const [detail, studentOptions] = await Promise.all([
    getCourseById(params.courseId, viewer),
    getUsersByRole("student"),
  ]);

  if (!detail) {
    notFound();
  }

  let modules: CourseModuleItem[] = [];
  let grades: CourseStudentGradeItem[] = [];
  let forumMessages: CourseForumMessageItem[] = [];
  let schemaMessage: string | null = null;

  try {
    [modules, grades, forumMessages] = await Promise.all([
      getTeacherCourseModules(params.courseId),
      getTeacherCourseGrades(params.courseId),
      getCourseForumMessages(params.courseId),
    ]);
  } catch (error) {
    if (error instanceof Error && isCourseModulesSchemaMismatchError(error.message)) {
      schemaMessage = courseModulesSchemaMismatchMessage;
    } else {
      throw error;
    }
  }

  return (
    <AppShell
      title={detail.course.title}
      description={`Instructor ${detail.course.teacherName} | ${detail.course.studentCount} students`}
      viewer={viewer}
    >
      <div className="space-y-8">
        <StudentList
          students={detail.students}
          studentOptions={studentOptions}
          courseId={detail.course.id}
          redirectPath={`/teacher/courses/${detail.course.id}`}
          canManage
        />

        {schemaMessage ? (
          <section className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6 text-amber-50">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">Course workflow unavailable</p>
            <p className="mt-3 text-base">{schemaMessage}</p>
          </section>
        ) : (
          <>
            <TeacherLessonBoard
              courseId={detail.course.id}
              modules={modules}
              addTaskAction={addLessonTask}
              toggleLessonCompletionAction={toggleLessonCompletion}
            />
            <CourseForum
              courseId={detail.course.id}
              currentUser={viewer.currentUser}
              messages={forumMessages}
              postMessageAction={postCourseMessage}
            />
            <TeacherCourseGradesPanel
              courseId={detail.course.id}
              students={detail.students}
              grades={grades}
              saveGradeAction={saveCourseGrade}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}