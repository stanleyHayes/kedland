"use client";

import { useId, useState } from "react";

import { enquirySchema, ENQUIRY_TOPIC_LABELS, SCHOOL_LEVEL_LABELS, type EnquiryInput } from "@kedland/types";
import {
  Button,
  buttonClasses,
  Card,
  Field,
  formatPhoneNumber,
  Icon,
  SelectField,
  TextareaField,
} from "@kedland/ui";

import { Turnstile } from "./turnstile";

/**
 * The enquiry form.
 *
 * Validated in the browser against `enquirySchema` — the same schema the API
 * enforces — so a parent sees a mistake immediately rather than after a round
 * trip, and the two can never disagree about what is valid.
 *
 * Client-side validation is a courtesy, not a control: the API re-validates
 * everything, because anything sent from a browser can be sent without one.
 */

type Values = Omit<EnquiryInput, "topic" | "level" | "turnstileToken"> & {
  topic: string;
  level: string;
};

const EMPTY: Values = {
  parentName: "",
  email: "",
  phone: "",
  topic: "general",
  level: "not-sure",
  message: "",
};

/** Built from the shared label maps so the form cannot list a value the API rejects. */
const TOPIC_OPTIONS = Object.entries(ENQUIRY_TOPIC_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const LEVEL_OPTIONS = Object.entries(SCHOOL_LEVEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

type Status = "editing" | "sending" | "sent" | "failed";

export interface EnquiryFormProps {
  /** Where to post. Read on the server — see the note in `turnstile.tsx`. */
  apiUrl: string;
  turnstileSiteKey: string | undefined;
}

/**
 * The API's own explanation for refusing an enquiry.
 *
 * These are RFC 7807 problem responses whose `detail` is already written for a
 * visitor to read — "We could not verify that you are human", and so on. Using
 * it beats a generic sentence for the parent and, more importantly, beats it for
 * whoever is trying to work out why nothing is arriving.
 */
async function reasonFrom(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    return typeof body.detail === "string" && body.detail.trim() ? body.detail : null;
  } catch {
    return null;
  }
}

export function EnquiryForm({ apiUrl, turnstileSiteKey }: Readonly<EnquiryFormProps>) {
  const formId = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [status, setStatus] = useState<Status>("editing");
  const [token, setToken] = useState<string>();
  /** The API's reason for the last refusal, when it gave one. */
  const [failure, setFailure] = useState<string | null>(null);
  // Incremented on a failed submit so the Turnstile widget issues a new token;
  // the one just sent has been consumed and will never verify again.
  const [turnstileNonce, setTurnstileNonce] = useState(0);

  const field = (name: keyof Values) => ({
    id: `${formId}-${name}`,
    name,
    value: values[name],
    error: errors[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues((current) => ({ ...current, [name]: event.target.value }));
      // Clear the message as soon as they start fixing it; leaving a stale
      // error under a field someone is actively correcting reads as broken.
      setErrors((current) => ({ ...current, [name]: undefined }));
    },
  });

  const choose = (name: "topic" | "level", value: string): void => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = enquirySchema.safeParse({ ...values, turnstileToken: token });
    if (!parsed.success) {
      const found: Partial<Record<keyof Values, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Values | undefined;
        if (key && !found[key]) found[key] = issue.message;
      }
      setErrors(found);
      return;
    }

    const failed = (reason: string | null): void => {
      setFailure(reason);
      setStatus("failed");
      // The token just sent has been consumed and will never verify again.
      setToken(undefined);
      setTurnstileNonce((n) => n + 1);
    };

    setStatus("sending");
    try {
      const response = await fetch(`${apiUrl}/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        // The API's own sentence, when it sent one. Throwing this away is how a
        // misconfigured spam check looked, for weeks, exactly like a flaky
        // network: every parent saw "we could not send that just now" while the
        // API was saying something specific on every single attempt.
        failed(await reasonFrom(response));
        return;
      }

      setStatus("sent");
      setValues(EMPTY);
    } catch {
      // A network failure, not an answer. Nothing here is worth quoting — the
      // browser's own wording is "Failed to fetch", which tells a parent
      // nothing and reads like the school's website is broken in some way they
      // caused.
      failed(null);
    }
  }

  if (status === "sent") {
    return (
      <Card accent="green">
        {/*
          Announced, because a visitor using a screen reader has no other way
          to know the form they just submitted has been replaced by this.
        */}
        <output className="block">
          <h3>Thank you — we have your message</h3>
          <p className="mt-2 text-ink/80">
            Someone from the school will be in touch shortly. If it is urgent, please call us on{" "}
            <a href="tel:+233257130333" className="font-semibold text-blue">
              +233 257 130 333
            </a>
            .
          </p>
        </output>

        {/*
          A way back to the form.

          The confirmation used to be the end of the page: a family with a second
          question, or anyone who mistyped their email and realised a moment
          later, had to reload to get the form back. It stays put rather than
          disappearing on a timer, because a message that removes itself while
          somebody is still reading it is worse than one that waits to be
          dismissed — and on a slow connection the timer would be the only thing
          they ever saw of it.
        */}
        <button
          type="button"
          className={buttonClasses({ variant: "secondary", className: "mt-6" })}
          onClick={() => {
            setStatus("editing");
            setFailure(null);
            setToken(undefined);
            // The token that was just spent will never verify again, so the
            // widget has to issue a fresh one for the next message.
            setTurnstileNonce((n) => n + 1);
          }}
        >
          Send another message
        </button>
      </Card>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      noValidate
      className="grid gap-5 sm:grid-cols-2"
    >
      {/*
        `noValidate` turns off the browser's own bubbles so ours are the only
        messages — theirs are unstyled, untranslated, and disappear on blur.
      */}

      <Field
        {...field("parentName")}
        label="Your name"
        placeholder="e.g. Ama Mensah"
        autoComplete="name"
        startIcon={<Icon name="user" className="size-5" />}
        required
      />
      <Field
        {...field("email")}
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        startIcon={<Icon name="mail" className="size-5" />}
        required
      />
      <div className="sm:col-span-2">
        <Field
          id={`${formId}-phone`}
          name="phone"
          value={values.phone}
          error={errors.phone}
          onChange={(event) => {
            setValues((current) => ({ ...current, phone: formatPhoneNumber(event.target.value) }));
            setErrors((current) => {
              const next = { ...current };
              delete next.phone;
              return next;
            });
          }}
          label="Phone"
          type="tel"
          placeholder="+233 24 123 4567"
          autoComplete="tel"
          inputMode="tel"
          maxLength={22}
          startIcon={<Icon name="phone" className="size-5" />}
          hint="We will call or WhatsApp you on this number."
          required
        />
      </div>

      <SelectField
        id={`${formId}-topic`}
        name="topic"
        value={values.topic}
        error={errors.topic}
        onValueChange={(value) => {
          choose("topic", value);
        }}
        label="What is this about?"
        options={TOPIC_OPTIONS}
        startIcon={<Icon name="message" className="size-5" />}
        required
      />
      <SelectField
        id={`${formId}-level`}
        name="level"
        value={values.level}
        error={errors.level}
        onValueChange={(value) => {
          choose("level", value);
        }}
        label="Which class?"
        hint="Not sure yet is a perfectly good answer."
        options={LEVEL_OPTIONS}
        startIcon={<Icon name="blocks" className="size-5" />}
        required
      />

      <div className="sm:col-span-2">
        <TextareaField
          {...field("message")}
          label="Your message"
          placeholder="Tell us a little about your child and what you would like to know."
          startIcon={<Icon name="message" className="size-5" />}
          rows={4}
          required
        />
      </div>

      <div className="sm:col-span-2">
        <Turnstile siteKey={turnstileSiteKey} onToken={setToken} resetSignal={turnstileNonce} />
      </div>

      {status === "failed" && (
        <p role="alert" className="text-small font-semibold text-red-text sm:col-span-2">
          {failure ?? "We could not send that just now."} Please try again, or call us on +233 257 130 333.
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={status === "sending"}
        withArrow
        className="w-full sm:col-span-2 sm:w-auto sm:justify-self-start"
      >
        {status === "sending" ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
