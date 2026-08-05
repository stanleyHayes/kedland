"use client";

import Image from "next/image";
import { useState } from "react";

import { Field, Icon } from "@kedland/ui";

import { PendingContent } from "./workflow-ui";

import { getMediaUploadSignature, updateProfilePhoto } from "@/app/(dashboard)/actions";

export function ProfilePhotoUploader({
  currentUrl,
  displayName,
}: Readonly<{ currentUrl: string | null; displayName: string }>) {
  const [preview, setPreview] = useState(currentUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const upload = async (form: HTMLFormElement): Promise<void> => {
    const data = new FormData(form);
    const file = data.get("profilePhoto");
    if (!(file instanceof File) || file.size === 0) {
      setMessage("Choose a photograph first.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file.");
      return;
    }
    if (file.size > 5_000_000) {
      setMessage("Choose an image smaller than 5 MB.");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const signed = await getMediaUploadSignature("profiles");
      const body = new FormData();
      body.set("file", file);
      body.set("api_key", signed.apiKey);
      body.set("timestamp", String(signed.timestamp));
      body.set("folder", signed.folder);
      body.set("signature", signed.signature);
      const response = await fetch(signed.uploadUrl, { method: "POST", body });
      if (!response.ok) throw new Error("The image host did not accept this photograph.");
      const result = (await response.json()) as { secure_url?: string };
      if (!result.secure_url) throw new Error("The image host returned no photograph URL.");

      const error = await updateProfilePhoto(result.secure_url);
      if (error) throw new Error(error);
      setPreview(result.secure_url);
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
        void upload(event.currentTarget);
      }}
    >
      <div className="flex items-center gap-4">
        <span className="admin-profile-avatar grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg font-display text-xl font-extrabold">
          {preview ? (
            <Image
              src={preview}
              alt={`${displayName}'s profile`}
              width={160}
              height={160}
              className="size-full object-cover"
            />
          ) : (
            <Icon name="user" className="size-8" />
          )}
        </span>
        <p className="text-small text-grey">
          Use a clear square portrait. It will appear in the dashboard header and account menu.
        </p>
      </div>
      <Field
        id="profile-photo"
        name="profilePhoto"
        type="file"
        accept="image/*"
        label="Photograph"
        required
      />
      {message && <output className="text-small font-semibold text-navy">{message}</output>}
      <button
        type="submit"
        disabled={busy}
        aria-busy={busy || undefined}
        className="admin-button admin-button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 font-display text-small font-bold"
      >
        {busy ? (
          <PendingContent pending label="Upload photograph" pendingLabel="Uploading" />
        ) : (
          <>
            <Icon name="images" className="size-4" />
            Upload photograph
          </>
        )}
      </button>
    </form>
  );
}
