import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CourseForum } from "@/components/CourseForum";
import { FileUploader } from "@/components/FileUploader";
import { FileList } from "@/components/FileList";
import { StudentList } from "@/components/StudentList";
import { StudentLessonBoard } from "@/components/student/StudentLessonBoard";
import {
  courseModulesSchemaMismatchMessage,
  isCourseModulesSchemaMismatchError,
} from "@/lib/auth-errors";
import { getCourseForumMessages, postCourseMessage } from "@/lib/course-forum-actions";
import { getCourseById, getCurrentViewer } from "@/lib/dbActions";
import { getCourseFiles, uploadFile } from "@/lib/file-actions";
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

  const resourceFiles = await getCourseFiles({ courseId: params.courseId });
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
            <section className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Resources and submissions</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Course files</h2>
              </div>
              <FileUploader courses={[detail.course]} assignments={detail.assignments} categories={["submission"]} defaultCategory="submission" uploadAction={uploadFile} />
              <FileList files={resourceFiles} />
            </section>
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