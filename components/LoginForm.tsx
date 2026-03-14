"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
    >
      {pending ? "Signing in..." : "Login"}
    </button>
  );
}

interface LoginFormProps {
  redirectTo?: string;
  error?: string;
  action: (formData: FormData) => void | Promise<void>;
}

export function LoginForm({ redirectTo, error, action }: LoginFormProps) {
  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />
      <label className="block text-sm text-slate-300">
        Email
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="teacher@eduflow.dev"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
        />
      </label>
      <label className="block text-sm text-slate-300">
        Password
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
        />
      </label>
      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      <SubmitButton />
    </form>
  );
}
