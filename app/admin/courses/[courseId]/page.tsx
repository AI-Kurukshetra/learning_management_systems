import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CourseBuilder } from "@/components/admin/CourseBuilder";
import {
  courseModulesSchemaMismatchMessage,
  isCourseModulesSchemaMismatchError,
} from "@/lib/auth-errors";
import {
  applyCourseTemplate,
  createCourseModule,
  deleteCourseModule,
  getAdminCourseModules,
  reorderCourseModules,
  updateCourseModule,
} from "@/lib/course-builder-actions";
import { getCourseById, getCurrentViewer } from "@/lib/dbActions";
import type { CourseModuleItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCourseBuilderPage({
  params,
}: {
  params: { courseId: string };
}) {
  const viewer = await getCurrentViewer();
  const courseDetail = await getCourseById(params.courseId, viewer);

  if (!courseDetail) {
    notFound();
  }

  let modules: CourseModuleItem[] = [];
  let schemaMessage: string | null = null;

  try {
    modules = await getAdminCourseModules(params.courseId);
  } catch (error) {
    if (error instanceof Error && isCourseModulesSchemaMismatchError(error.message)) {
      schemaMessage = courseModulesSchemaMismatchMessage;
    } else {
      throw error;
    }
  }

  return (
    <AppShell
      title="Course Builder"
      description="Design the course curriculum with draggable modules, templates, and curriculum mapping."
      viewer={viewer}
      actions={
        <Link
          href="/admin/courses"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          Back to courses
        </Link>
      }
    >
      {schemaMessage ? (
        <section className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Course builder</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">{courseDetail.course.title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              The course exists, but the curriculum module table has not been created in Supabase yet.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Teacher</p>
                <p className="mt-2 text-lg font-semibold text-white">{courseDetail.course.teacherName}</p>
                <p className="text-sm text-slate-400">{courseDetail.course.teacherEmail}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Students</p>
                <p className="mt-2 text-3xl font-semibold text-white">{courseDetail.course.studentCount}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Assignments</p>
                <p className="mt-2 text-3xl font-semibold text-white">{courseDetail.course.assignmentCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6 text-amber-50">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">Migration required</p>
            <p className="mt-3 text-base text-amber-50">{schemaMessage}</p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-amber-100">
              <li>Open your Supabase SQL Editor.</li>
              <li>Run `supabase/eduflow-schema.sql` from this project.</li>
              <li>Refresh this page after the SQL completes.</li>
            </ol>
          </div>
        </section>
      ) : (
        <CourseBuilder
          course={courseDetail.course}
          initialModules={modules}
          createModuleAction={createCourseModule}
          updateModuleAction={updateCourseModule}
          deleteModuleAction={deleteCourseModule}
          reorderModulesAction={reorderCourseModules}
          applyTemplateAction={applyCourseTemplate}
        />
      )}
    </AppShell>
  );
}
