"use client";

import { useState } from "react";

import { Field } from "@kedland/ui";

import { MediaPicker, type MediaPickerOption } from "@/components/content/media-picker";

/**
 * The header image on a post: choosing one, changing it, or taking it away.
 *
 * The picker always offers "No header image" as its first tile, and that tile is
 * the whole removal story — there is no separate delete button, because a button
 * that removes an image is a second way to express a choice the radio group
 * already expresses, and two controls for one value is how an editor ends up
 * unsure which one won.
 *
 * The empty value is submitted as `coverMediaId=""`. The server action reads
 * that as *remove* on an existing post and as *never had one* on a new draft —
 * a distinction the form cannot make and does not try to.
 *
 * Alt text is required whenever an image is chosen, because the API refuses a
 * cover without it. Rather than let that surface as a validation error after
 * the editor has pressed Save, the description is prefilled from the library
 * entry — which was itself written by whoever uploaded the file, and is usually
 * the right sentence already.
 */

/** The value that means "this post has no header image". */
const NONE = "";

export function CoverImageField({
  idPrefix,
  options,
  defaultMediaId,
  defaultAlt,
}: Readonly<{
  idPrefix: string;
  options: readonly MediaPickerOption[];
  defaultMediaId?: string | undefined;
  defaultAlt?: string | undefined;
}>) {
  const [mediaId, setMediaId] = useState(defaultMediaId ?? NONE);
  const [alt, setAlt] = useState(defaultAlt ?? "");

  if (options.length === 0) {
    return (
      <p className="text-small text-grey">
        No approved images yet. Upload one in Media library and it will appear here as a choice.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <MediaPicker
        id={`${idPrefix}-cover`}
        name="coverMediaId"
        label="Header image"
        options={[{ value: NONE, label: "No header image" }, ...options]}
        value={mediaId}
        onValueChange={(next) => {
          setMediaId(next);
          const chosen = options.find((option) => option.value === next);
          // Only when the editor has not written their own description: their
          // sentence is about this article, the library's is about the file.
          if (next !== NONE && chosen && !alt.trim()) setAlt(chosen.label);
        }}
      />

      {mediaId !== NONE && (
        <Field
          id={`${idPrefix}-cover-alt`}
          name="coverAlt"
          label="Describe the header image"
          value={alt}
          onChange={(event) => {
            setAlt(event.target.value);
          }}
          required
          hint="Read aloud to visitors using a screen reader, and shown if the image cannot load."
        />
      )}
    </div>
  );
}
