import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CourseForum } from "@/components/CourseForum";
import { StudentList } from "@/components/StudentList";
import { StudentLessonBoard } from "@/components/student/StudentLessonBoard";
import {
  courseModulesSchemaMismatchMessage,
  isCourseModulesSchemaMismatchError,
} from "@/lib/auth-errors";
import { getCourseForumMessages, postCourseMessage } from "@/lib/course-forum-actions";
import { getCourseById, getCurrentViewer } from "@/lib/dbActions";
import { getStudentCourseGrade, getStudentCourseModules } from "@/lib/student-course-actions";
import type { CourseForumMessageItem, CourseModuleItem, CourseStudentGradeItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StudentCourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const viewer = await getCurrentViewer();
  const detail = await getCourseById(params.courseId, viewer);

  if (!detail) {
    notFound();
  }

  let modules: CourseModuleItem[] = [];
  let courseGrade: CourseStudentGradeItem | null = null;
  let forumMessages: CourseForumMessageItem[] = [];
  let schemaMessage: string | null = null;

  try {
    [modules, courseGrade, forumMessages] = await Promise.all([
      getStudentCourseModules(params.courseId),
      getStudentCourseGrade(params.courseId),
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
          studentOptions={[]}
          courseId={detail.course.id}
          redirectPath={`/student/courses/${detail.course.id}`}
          canManage={false}
        />

        {schemaMessage ? (
          <section className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6 text-amber-50">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">Course workflow unavailable</p>
            <p className="mt-3 text-base">{schemaMessage}</p>
          </section>
        ) : (
          <>
            <StudentLessonBoard modules={modules} courseGrade={courseGrade} />
            <CourseForum
              courseId={detail.course.id}
              currentUser={viewer.currentUser}
              messages={forumMessages}
              postMessageAction={postCourseMessage}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}