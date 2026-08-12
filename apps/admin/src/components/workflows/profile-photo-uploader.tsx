"use client";

import { useState } from "react";

import { Icon } from "@kedland/ui";

import { PendingContent } from "./workflow-ui";

import { getMediaUploadSignature, updateProfilePhoto } from "@/app/(dashboard)/actions";
import { ImagePicker } from "@/components/media/image-picker";

/**
 * The staff member's own photograph.
 *
 * The upload used to fail outright with "the image host did not accept this
 * photograph", and the reason was one missing field. The API signs
 * `{ folder, timestamp, transformation }`, and Cloudinary recomputes that
 * signature from whatever the browser actually sends — so omitting
 * `transformation`, as this form did, guarantees a mismatch and a refusal, for
 * every photograph, every time. The media library sent it and worked; this did
 * not and never could.
 *
 * Both now go through `ImagePicker`, which is the real repair: there is one
 * place that knows what an upload consists of, so the two cannot drift apart
 * again.
 */
export function ProfilePhotoUploader({
  currentUrl,
  displayName,
}: Readonly<{ currentUrl: string | null; displayName: string }>) {
  const [preview, setPreview] = useState(currentUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [chosen, setChosen] = useState<File | null>(null);

  const upload = async (): Promise<void> => {
    if (!chosen) {
      setMessage("Choose a photograph first.");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const signed = await getMediaUploadSignature("profiles");

      const body = new FormData();
      body.set("file", chosen);
      body.set("api_key", signed.apiKey);
      body.set("timestamp", String(signed.timestamp));
      body.set("folder", signed.folder);
      // Signed by the API, so it has to travel with the upload. Leaving it out
      // is what made every profile photograph fail.
      body.set("transformation", signed.transformation);
      body.set("signature", signed.signature);

      const response = await fetch(signed.uploadUrl, { method: "POST", body });
      if (!response.ok) {
        // Cloudinary explains itself; repeating its words beats inventing ours.
        const detail = await cloudinaryReason(response);
        throw new Error(detail ?? "The image host did not accept this photograph.");
      }

      const result = (await response.json()) as { secure_url?: string };
      if (!result.secure_url) throw new Error("The image host returned no photograph URL.");

      const error = await updateProfilePhoto(result.secure_url);
      if (error) throw new Error(error);

      setPreview(result.secure_url);
      setChosen(null);
      setMessage("Profile photograph updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The photograph could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void upload();
      }}
    >
      <ImagePicker
        name="profilePhoto"
        label="Your photograph"
        shape="square"
        currentUrl={preview}
        disabled={busy}
        hint="a square portrait works best"
        onChoose={(file) => {
          setChosen(file);
          setMessage(null);
        }}
      />

      <p className="text-small text-grey">
        {displayName}&apos;s photograph appears in the dashboard header and the account menu.
      </p>

      {message && <output className="text-small font-semibold text-navy">{message}</output>}

      <button
        type="submit"
        disabled={busy || !chosen}
        aria-busy={busy || undefined}
        className="admin-button admin-button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 font-display text-small font-bold"
      >
        {busy ? (
          <PendingContent pending label="Save photograph" pendingLabel="Uploading" />
        ) : (
          <>
            <Icon name="images" className="size-4" />
            Save photograph
          </>
        )}
      </button>
    </form>
  );
}

/** Cloudinary's own message for a refusal, when it sent one. */
async function cloudinaryReason(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { error?: { message?: unknown } };
    const message = body.error?.message;
    return typeof message === "string" && message.trim() ? message : null;
  } catch {
    return null;
  }
}
