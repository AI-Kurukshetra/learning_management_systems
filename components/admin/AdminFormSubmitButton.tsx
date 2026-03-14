"use client";

import { useFormStatus } from "react-dom";

interface AdminFormSubmitButtonProps {
  idleLabel: string;
  loadingLabel: string;
  className: string;
}

export function AdminFormSubmitButton({
  idleLabel,
  loadingLabel,
  className,
}: AdminFormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}>
      <span className="inline-flex items-center gap-2">
        {pending ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
        ) : null}
        <span>{pending ? loadingLabel : idleLabel}</span>
      </span>
    </button>
  );
}
