"use client";

import { useId, useState } from "react";

import { enquirySchema, ENQUIRY_TOPIC_LABELS, SCHOOL_LEVEL_LABELS, type EnquiryInput } from "@kedland/types";
import { Button, Card, Field, SelectField, TextareaField } from "@kedland/ui";

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

export function EnquiryForm({ apiUrl, turnstileSiteKey }: Readonly<EnquiryFormProps>) {
  const formId = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [status, setStatus] = useState<Status>("editing");
  const [token, setToken] = useState<string>();

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

    setStatus("sending");
    try {
      const response = await fetch(`${apiUrl}/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) throw new Error(String(response.status));

      setStatus("sent");
      setValues(EMPTY);
    } catch {
      setStatus("failed");
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

      <Field {...field("parentName")} label="Your name" autoComplete="name" required />
      <Field {...field("email")} label="Email" type="email" autoComplete="email" required />
      <div className="sm:col-span-2">
        <Field
          {...field("phone")}
          label="Phone"
          type="tel"
          autoComplete="tel"
          hint="We will call or WhatsApp you on this number."
          required
        />
      </div>

      <SelectField {...field("topic")} label="What is this about?" options={TOPIC_OPTIONS} required />
      <SelectField
        {...field("level")}
        label="Which class?"
        hint="Not sure yet is a perfectly good answer."
        options={LEVEL_OPTIONS}
        required
      />

      <div className="sm:col-span-2">
        <TextareaField
          {...field("message")}
          label="Your message"
          placeholder="Tell us a little about your child and what you would like to know."
          rows={4}
          required
        />
      </div>

      <div className="sm:col-span-2">
        <Turnstile siteKey={turnstileSiteKey} onToken={setToken} />
      </div>

      {status === "failed" && (
        <p role="alert" className="text-small font-semibold text-red-text sm:col-span-2">
          We could not send that just now. Please try again, or call us on +233 257 130 333.
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
