"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button, Field } from "@kedland/ui";

import { signIn, type LoginState } from "./actions";

/**
 * The sign-in form.
 *
 * A client component only for the pending state and the error message — the
 * submission itself is a Server Action, so the form posts and works with no
 * JavaScript at all, and the password never becomes a value React holds.
 */

function SubmitButton() {
  // `useFormStatus` has to be read from inside the form it describes, which is
  // why this is its own component rather than a flag on the parent.
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field
        id="email"
        name="email"
        label="Email address"
        type="email"
        autoComplete="username"
        // The first thing anyone arriving here wants to type.
        autoFocus
        required
      />

      <Field
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
      />

      {state.error && (
        // `role="alert"` so the message is announced when it replaces the
        // previous state, not merely rendered where a sighted user will notice.
        <p role="alert" className="text-small font-semibold text-red-text">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
