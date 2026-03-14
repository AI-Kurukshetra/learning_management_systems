import { FileList } from "@/components/FileList";
import { FileUploader } from "@/components/FileUploader";
import { uploadFile } from "@/lib/file-actions";
import type { AssignmentListItem, CourseListItem, FileCategory, FileItem } from "@/lib/types";

interface ResourceRepositoryProps {
  files: FileItem[];
  courses: CourseListItem[];
  assignments: AssignmentListItem[];
  categories: FileCategory[];
  defaultCategory: FileCategory;
  canManage: boolean;
}

export function ResourceRepository({ files, courses, assignments, categories, defaultCategory, canManage }: ResourceRepositoryProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Resources</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Course files and materials</h2>
      </div>
      {canManage ? <FileUploader courses={courses} assignments={assignments} categories={categories} defaultCategory={defaultCategory} uploadAction={uploadFile} /> : null}
      <FileList files={files} canDelete={canManage} />
    </section>
  );
}