"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { emptyActionState } from "@/lib/types";

export function AuthForm({ notice = "" }: { notice?: string }) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [signInState, signInAction] = useActionState(signIn, emptyActionState);
  const [signUpState, signUpAction] = useActionState(signUp, emptyActionState);
  const state = mode === "sign-in" ? signInState : signUpState;
  const action = mode === "sign-in" ? signInAction : signUpAction;

  return (
    <section className="rounded-[1.75rem] border border-line bg-card p-6 shadow-[0_24px_60px_-36px_rgba(36,28,22,0.55)] sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-clay">Private notebook</p>
      <h2 className="mt-2 font-serif text-3xl text-ink">
        {mode === "sign-in" ? "Sign in" : "Create an account"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Trips, days, and expenses stay on your account.
      </p>

      <div className="mt-6 grid grid-cols-2 rounded-full bg-sand p-1 text-sm">
        <button
          type="button"
          className={`rounded-full px-3 py-2 ${mode === "sign-in" ? "bg-card text-ink shadow-sm" : "text-muted"}`}
          onClick={() => setMode("sign-in")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-2 ${mode === "sign-up" ? "bg-card text-ink shadow-sm" : "text-muted"}`}
          onClick={() => setMode("sign-up")}
        >
          Create account
        </button>
      </div>

      <form action={action} className="mt-6 space-y-4">
        {notice ? (
          <p className="rounded-xl bg-sand px-3 py-2 text-sm text-ink" role="status">
            {notice}
          </p>
        ) : null}
        {state.error ? (
          <p className="rounded-xl bg-[#f8e4da] px-3 py-2 text-sm text-clay-dark" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p className="rounded-xl bg-[#e5efe6] px-3 py-2 text-sm text-moss" role="status">
            {state.message}
          </p>
        ) : null}

        <label className="block">
          <span className="label">Email</span>
          <input
            className="field"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <input
            className="field"
            type="password"
            name="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />
        </label>
        <SubmitButton className="btn-primary w-full" pendingLabel="Please wait…">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </SubmitButton>
      </form>
    </section>
  );
}
