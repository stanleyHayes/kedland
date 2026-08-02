"use client";

import { useState } from "react";

import { Field, Icon } from "@kedland/ui";

import { PRIMARY_BUTTON, SECONDARY_BUTTON, DANGER_BUTTON, WorkflowError } from "./workflow-ui";

import { beginMfaEnrolment, disableMfa, enableMfa } from "@/app/(dashboard)/actions";

/**
 * Turning two-factor authentication on and off.
 *
 * Three states, and the order is the point:
 *
 *  - **Off.** One button, which fetches a secret but stores nothing.
 *  - **Enrolling.** The QR and the typed key, then a code from the app. Nothing
 *    is committed until that code verifies, so closing the tab here leaves the
 *    account exactly as it was rather than demanding codes from a secret nobody
 *    scanned.
 *  - **Codes.** The recovery codes, shown once. This step does not offer a way
 *    past it that is easier than reading them, because they cannot be recovered.
 *
 * The QR is rendered from the `otpauth://` URI without a QR library: the school
 * can type the key instead, and one more dependency in the dashboard is not
 * worth saving them that. See `QrFallback`.
 */

interface MfaControlsProps {
  enabled: boolean;
  /** False when the server has no encryption key, so enrolling is impossible. */
  available: boolean;
}

type Stage = "idle" | "enrolling" | "codes";

/**
 * The key, formatted for someone typing it into a phone.
 *
 * Four-character groups, because a 32-character run of letters is transcribed
 * wrongly more often than not.
 */
function grouped(secret: string): string {
  return (secret.match(/.{1,4}/g) ?? [secret]).join(" ");
}

export function MfaControls({ enabled, available }: Readonly<MfaControlsProps>) {
  const [stage, setStage] = useState<Stage>("idle");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (work: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!available) {
    return (
      <p className="text-small text-grey">
        Two-factor authentication is not configured on this server. An administrator needs to set
        <code className="mx-1 rounded bg-cream px-1.5 py-0.5 font-mono text-[0.78rem]">
          MFA_ENCRYPTION_KEY
        </code>
        before it can be switched on — until then, authenticator secrets could not be stored safely.
      </p>
    );
  }

  if (stage === "codes") {
    return (
      <div className="grid gap-4">
        <div>
          <p className="font-display font-bold text-navy">Save these recovery codes</p>
          <p className="mt-1 max-w-2xl text-small text-grey">
            Each one signs you in once if you lose your phone. They are shown now and never again — print
            them, or put them somewhere only the school can reach.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-2 rounded-md border border-sky/60 bg-cream/60 p-4 font-mono text-small sm:grid-cols-3">
          {codes.map((code) => (
            <li key={code} className="tracking-wider text-ink">
              {code}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={SECONDARY_BUTTON}
            onClick={() => {
              void navigator.clipboard.writeText(codes.join("\n"));
            }}
          >
            Copy all
          </button>
          <button
            type="button"
            className={PRIMARY_BUTTON}
            onClick={() => {
              setStage("idle");
              setCodes([]);
            }}
          >
            I have saved them
          </button>
        </div>
      </div>
    );
  }

  if (stage === "enrolling") {
    return (
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const code = new FormData(event.currentTarget).get("code");
          void run(async () => {
            setCodes(await enableMfa(secret, typeof code === "string" ? code : ""));
            setStage("codes");
          });
        }}
      >
        {error && <WorkflowError message={error} />}

        <div>
          <p className="font-display font-bold text-navy">Scan this with your authenticator app</p>
          <p className="mt-1 max-w-2xl text-small text-grey">
            Google Authenticator, 1Password, Authy — any of them. If the camera will not cooperate, type the
            key in instead.
          </p>
        </div>

        <QrFallback uri={uri} secret={secret} />

        <Field
          id="mfa-code"
          name="code"
          label="Enter the six-digit code it shows"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          required
          hint="This proves the app is set up before the account starts asking for codes."
        />

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
            {busy ? "Checking…" : "Turn on"}
          </button>
          <button
            type="button"
            className={SECONDARY_BUTTON}
            onClick={() => {
              setStage("idle");
              setError(null);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (enabled) {
    return (
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const password = new FormData(event.currentTarget).get("password");
          void run(async () => {
            await disableMfa(typeof password === "string" ? password : "");
          });
        }}
      >
        {error && <WorkflowError message={error} />}

        <Field
          id="mfa-password"
          name="password"
          type="password"
          label="Your password"
          autoComplete="current-password"
          required
          hint="Required to switch two-factor off, so an unlocked laptop cannot remove it."
        />

        <button type="submit" disabled={busy} className={DANGER_BUTTON}>
          {busy ? "Turning off…" : "Turn off two-factor"}
        </button>
      </form>
    );
  }

  return (
    <div className="grid gap-3">
      {error && <WorkflowError message={error} />}
      <button
        type="button"
        disabled={busy}
        className={PRIMARY_BUTTON}
        onClick={() => {
          void run(async () => {
            const enrolment = await beginMfaEnrolment();
            setSecret(enrolment.secret);
            setUri(enrolment.uri);
            setStage("enrolling");
          });
        }}
      >
        {busy ? "Preparing…" : "Set up two-factor authentication"}
      </button>
    </div>
  );
}

/**
 * The enrolment key, as a link and as text.
 *
 * No QR image. Rendering one needs either a library — a dependency added to the
 * dashboard so somebody can avoid typing 32 characters once — or a remote QR
 * service, which would mean sending the secret to a third party, which is
 * obviously unacceptable. The `otpauth://` link opens the app directly on the
 * phone the dashboard is being used from, and the grouped key covers every other
 * case.
 */
function QrFallback({ uri, secret }: Readonly<{ uri: string; secret: string }>) {
  return (
    <div className="grid gap-3 rounded-md border border-sky/60 bg-cream/60 p-4">
      <a href={uri} className="inline-flex items-center gap-2 font-bold text-blue underline">
        <Icon name="shield" className="size-4" />
        Open in your authenticator app
      </a>

      <div>
        <p className="text-small text-grey">Or type this key in:</p>
        <p className="mt-1 select-all font-mono text-[0.95rem] tracking-wider text-ink">{grouped(secret)}</p>
      </div>
    </div>
  );
}
