"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import type { AppUser } from "@/lib/types";

interface CreateManagedUserState {
  success: boolean;
  error: string | null;
  message: string | null;
}

const initialState: CreateManagedUserState = {
  success: false,
  error: null,
  message: null,
};

interface AdminCreateUserFormProps {
  role: "teacher" | "student" | "parent";
  action: (state: CreateManagedUserState, formData: FormData) => Promise<CreateManagedUserState>;
  parents?: AppUser[];
}

function getRoleLabel(role: "teacher" | "student" | "parent") {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function AdminCreateUserForm({ role, action, parents = [] }: AdminCreateUserFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [router, state.success]);

  const roleLabel = getRoleLabel(role);

  return (
    <form ref={formRef} action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="role" value={role} />
      <input
        name="name"
        required
        placeholder={`${roleLabel} name`}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
      />
      <input
        type="email"
        name="email"
        required
        placeholder={`${role}@eduflow.dev`}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
      />
      <input
        type="password"
        name="password"
        required
        placeholder="Temporary password"
        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
      />
      {role === "student" ? (
        <label className="block text-sm text-slate-300">
          Select parent
          <select
            name="parentId"
            defaultValue=""
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/40"
          >
            <option value="">No linked parent</option>
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name} ({parent.email})
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {state.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {state.error}
        </div>
      ) : null}
      {state.success && state.message ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {state.message}
        </div>
      ) : null}
      <AdminFormSubmitButton
        idleLabel={`Create ${role}`}
        loadingLabel={`Creating ${role}...`}
        className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
      />
    </form>
  );
}
