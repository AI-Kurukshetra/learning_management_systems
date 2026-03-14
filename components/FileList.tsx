"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FileItem } from "@/lib/types";
import { deleteFile } from "@/lib/file-actions";

function DeleteButton({ fileId }: { fileId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const formData = new FormData();
          formData.set("fileId", fileId);
          await deleteFile({ success: false, error: null, message: null }, formData);
          router.refresh();
        });
      }}
      className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-70"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}

export function FileList({ files, canDelete = false }: { files: FileItem[]; canDelete?: boolean }) {
  return (
    <section className="space-y-3">
      {files.map((file) => (
        <article key={file.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">{file.fileName}</p>
              <p className="mt-1 text-sm text-slate-400">{file.courseTitle} · {file.category} · {file.uploaderName}</p>
            </div>
            <div className="flex gap-3">
              <a href={file.fileUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300">
                Download
              </a>
              {canDelete ? <DeleteButton fileId={file.id} /> : null}
            </div>
          </div>
        </article>
      ))}
      {files.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No files available.</div> : null}
    </section>
  );
}