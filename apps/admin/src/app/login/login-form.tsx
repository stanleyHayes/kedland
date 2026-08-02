"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, Field, Icon } from "@kedland/ui";

import { signIn, verifyMfa, type LoginState } from "./actions";

/**
 * The sign-in form.
 *
 * A client component only for the pending state and the error message — the
 * submission itself is a Server Action, so the form posts and works with no
 * JavaScript at all, and the password never becomes a value React holds.
 */

function SubmitButton({
  label = "Sign in",
  pendingLabel = "Signing in…",
}: Readonly<{ label?: string; pendingLabel?: string }>) {
  // `useFormStatus` has to be read from inside the form it describes, which is
  // why this is its own component rather than a flag on the parent.
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full !rounded-md">
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(signIn, {});
  const [passwordVisible, setPasswordVisible] = useState(false);

  /*
   * The password was right and a code is outstanding.
   *
   * A separate form rather than a field revealed inside the first: the two steps
   * submit to different actions, and leaving the password inputs mounted would
   * mean the browser re-posting credentials that have already been accepted.
   */
  if (state.challenge) return <MfaChallengeForm challenge={state.challenge} />;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field
        id="email"
        name="email"
        label="Email address"
        type="email"
        placeholder="name@kedland.edu.gh"
        startIcon={
          <span className="admin-field-glyph grid size-7 place-items-center">
            <Icon name="mail" className="size-3.5" />
          </span>
        }
        className="admin-neu-field"
        autoComplete="username"
        // The first thing anyone arriving here wants to type.
        autoFocus
        required
      />

      <Field
        id="password"
        name="password"
        label="Password"
        type={passwordVisible ? "text" : "password"}
        placeholder="Enter your password"
        startIcon={
          <span className="admin-field-glyph grid size-7 place-items-center">
            <Icon name="shield" className="size-3.5" />
          </span>
        }
        endAction={
          <button
            type="button"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-controls="password"
            aria-pressed={passwordVisible}
            title={passwordVisible ? "Hide password" : "Show password"}
            onClick={() => {
              setPasswordVisible((visible) => !visible);
            }}
            className={`admin-password-toggle grid size-10 place-items-center text-navy ${
              passwordVisible ? "admin-password-toggle-pressed" : ""
            }`.trim()}
          >
            <Icon name={passwordVisible ? "eye-off" : "eye"} className="size-4.5" />
          </button>
        }
        className="admin-neu-field"
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

/**
 * The second step of a two-factor sign-in.
 *
 * `autoComplete="one-time-code"` so a phone offers the code from its messages or
 * password manager, and `inputMode="numeric"` so it opens the number pad — the
 * two small things that make entering six digits on a phone bearable.
 */
function MfaChallengeForm({ challenge }: Readonly<{ challenge: string }>) {
  const [state, formAction] = useActionState<LoginState, FormData>(verifyMfa, { challenge });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="challenge" value={challenge} />

      <div>
        <p className="font-display font-bold text-navy">Two-factor authentication</p>
        <p className="mt-1 text-small text-grey">
          Enter the six-digit code from your authenticator app, or one of your recovery codes.
        </p>
      </div>

      <Field
        id="code"
        name="code"
        label="Code"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        required
        startIcon={
          <span className="admin-field-glyph grid size-7 place-items-center">
            <Icon name="shield" className="size-3.5" />
          </span>
        }
        className="admin-neu-field tracking-[0.3em]"
      />

      {state.error && (
        <p role="alert" className="text-small font-semibold text-red-text">
          {state.error}
        </p>
      )}

      <SubmitButton label="Verify" pendingLabel="Checking…" />
    </form>
  );
}
