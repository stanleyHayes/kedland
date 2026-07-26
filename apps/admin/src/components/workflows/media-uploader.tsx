"use client";

import { useState } from "react";

import { Field } from "@kedland/ui";

import { PRIMARY_BUTTON } from "./workflow-ui";

import type { UploadResult } from "@kedland/types";
import type { SyntheticEvent } from "react";

import { getMediaUploadSignature, registerMedia } from "@/app/(dashboard)/actions";

function formText(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function MediaUploader() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const uploadMedia = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage(null);

    try {
      const form = new FormData(formElement);
      const file = form.get("file");
      const alt = formText(form, "alt");
      if (!(file instanceof File) || file.size === 0) throw new Error("Choose an image to upload.");
      if (!alt) throw new Error("Describe the image before uploading it.");

      const signed = await getMediaUploadSignature();
      const upload = new FormData();
      upload.set("file", file);
      upload.set("api_key", signed.apiKey);
      upload.set("timestamp", String(signed.timestamp));
      upload.set("folder", signed.folder);
      upload.set("signature", signed.signature);

      const response = await fetch(signed.uploadUrl, { method: "POST", body: upload });
      if (!response.ok) throw new Error("Cloudinary did not accept the image.");
      const result = (await response.json()) as UploadResult;

      await registerMedia({
        publicId: result.public_id,
        url: result.secure_url,
        alt,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        depictsPupils: form.get("depictsPupils") === "on",
        consentOnFile: form.get("consentOnFile") === "on",
        consentRef: formText(form, "consentRef") || null,
      });

      formElement.reset();
      setMessage("Image uploaded and added to the library.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        void uploadMedia(event);
      }}
    >
      <Field id="media-file" name="file" type="file" accept="image/*" label="Image" required />
      <Field id="media-alt" name="alt" label="Alt text" required hint="Describe what the image shows." />
      <div className="admin-consent-grid">
        <label className="flex items-start gap-3 font-semibold text-navy">
          <input name="depictsPupils" type="checkbox" className="admin-checkbox size-4 accent-navy" />
          Depicts identifiable pupils
        </label>
        <label className="flex items-start gap-3 font-semibold text-navy">
          <input name="consentOnFile" type="checkbox" className="admin-checkbox size-4 accent-navy" />
          Written consent is on file
        </label>
      </div>
      <Field
        id="media-consent-ref"
        name="consentRef"
        label="Consent reference"
        hint="Required when pupil consent is recorded."
      />
      {message && <output className="text-small font-semibold text-navy">{message}</output>}
      <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
        {busy ? "Uploading…" : "Upload image"}
      </button>
    </form>
  );
}
