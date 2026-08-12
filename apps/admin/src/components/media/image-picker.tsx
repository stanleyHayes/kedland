"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { ACCEPTED_IMAGE_LABEL, ACCEPTED_IMAGE_TYPES, formatBytes, MAX_UPLOAD_BYTES } from "@kedland/types";
import { Icon } from "@kedland/ui";

/**
 * Choosing a photograph.
 *
 * The native control was doing three things badly at once. It said "Choose
 * File" and then a filename, which tells an editor nothing about whether they
 * picked the right photograph; it stated no limits, so a 40 MB scan was
 * discovered to be too large only after it had been sent; and it looked like
 * 1998 in the middle of a dashboard that does not.
 *
 * So the frame *is* the preview. The photograph appears in the same box it was
 * dropped into, at the aspect ratio it will actually occupy — square for a
 * portrait, wide for a page image — because the question in the editor's head
 * is never "which file is this" but "does this look right there". The rules sit
 * under the frame permanently rather than appearing as an error after the fact:
 * a limit you are told about is a constraint, a limit you discover is a fault.
 *
 * The real `<input type="file">` is still here, still the thing that opens the
 * picker and still what a form reads. It is visually hidden rather than
 * replaced, so keyboard focus, screen readers and the form all behave exactly
 * as they would without any of this.
 */

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

export type ImagePickerShape = "square" | "wide";

const FRAME: Record<ImagePickerShape, string> = {
  square: "aspect-square max-w-[13rem]",
  wide: "aspect-[16/9]",
};

interface ImagePickerProps {
  /** The form field name; this is a real file input. */
  name: string;
  label: string;
  shape?: ImagePickerShape;
  /** Where this photograph will be seen. One short sentence, or nothing. */
  hint?: string;
  /** Shown in the frame before anything is chosen — the image already in use. */
  currentUrl?: string | null;
  disabled?: boolean;
  /** Told when the choice changes, so a parent form can clear its own errors. */
  onChoose?: (file: File | null) => void;
}

/** Why a file was refused, in words an editor can act on. */
function refusal(file: File): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    // Named rather than described: "unsupported format" leaves them guessing
    // which of their photographs is the problem.
    const got = file.type.replace("image/", "").toUpperCase() || "that file type";
    return `${got} cannot be used. Choose a ${ACCEPTED_IMAGE_LABEL} image.`;
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return `That photograph is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`;
  }

  return null;
}

export function ImagePicker({
  name,
  label,
  shape = "wide",
  hint,
  currentUrl,
  disabled,
  onChoose,
}: Readonly<ImagePickerProps>) {
  const inputId = useId();
  const describedBy = `${inputId}-rules`;
  const input = useRef<HTMLInputElement>(null);

  const [chosen, setChosen] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Derived rather than stored: the URL is a pure function of the file, and
  // putting it in state meant setting state from an effect, which renders twice
  // and briefly shows an empty frame over a photograph that is already chosen.
  const objectUrl = useMemo(() => (chosen ? URL.createObjectURL(chosen) : null), [chosen]);

  // Released when the choice changes and on unmount. A preview URL kept for the
  // life of the page holds the whole file in memory, and the school uploads from
  // phones.
  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl],
  );

  const take = (file: File | null): void => {
    if (!file) {
      setChosen(null);
      setError(null);
      onChoose?.(null);
      return;
    }

    const why = refusal(file);
    if (why) {
      setError(why);
      setChosen(null);
      // The input keeps the rejected file otherwise, so the form would submit
      // the very thing just refused.
      if (input.current) input.current.value = "";
      onChoose?.(null);
      return;
    }

    setError(null);
    setChosen(file);
    onChoose?.(file);
  };

  /** Puts a dropped file into the real input, so the form still sees it. */
  const drop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;

    const file = event.dataTransfer.files.item(0);
    if (!file) return;

    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (input.current) input.current.files = transfer.files;
    take(file);
  };

  const preview = objectUrl ?? currentUrl ?? null;

  return (
    <div className="grid gap-3">
      <p className="font-display text-small font-bold text-navy">{label}</p>

      {/*
        Drag and drop is an accelerator here, never the only way in. Every
        capability this box has is also on the button inside it, which is a real
        `<button>` reached by keyboard and announced by screen readers, and the
        file input behind it is a real input. There is no keyboard trap to fix
        because there is no keyboard-only user who is worse off — dropping a file
        is not something a pointer-less visitor was going to do regardless.
      */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className={`admin-image-picker relative overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          dragging ? "admin-image-picker-active" : ""
        } ${FRAME[shape]} ${disabled ? "opacity-60" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={drop}
      >
        {preview ? (
          // A plain <img>: the source is a blob: URL that changes on every
          // choice, which next/image cannot optimise and would only proxy.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center px-4 text-center">
            <div>
              <Icon name="images" className="mx-auto size-8 text-blue" />
              <p className="mt-2 text-small text-grey">
                {dragging ? "Drop it here" : "Drag a photograph here, or"}
              </p>
            </div>
          </div>
        )}

        {/* Over the preview once there is one, so replacing never means hunting. */}
        <div
          className={`absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-2 p-3 ${
            preview ? "admin-image-picker-bar" : ""
          }`}
        >
          <button
            type="button"
            disabled={disabled}
            className="admin-button admin-button-secondary text-small"
            onClick={() => input.current?.click()}
          >
            <Icon name="camera" className="mr-2 size-4" />
            {preview ? "Choose a different one" : "Choose a photograph"}
          </button>

          {chosen && (
            <button
              type="button"
              disabled={disabled}
              className="admin-button admin-button-secondary text-small"
              onClick={() => {
                if (input.current) input.current.value = "";
                take(null);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <input
        ref={input}
        id={inputId}
        name={name}
        type="file"
        accept={ACCEPT}
        disabled={disabled}
        aria-describedby={describedBy}
        className="sr-only"
        onChange={(event) => {
          take(event.target.files?.item(0) ?? null);
        }}
      />

      <p id={describedBy} className="text-small text-grey">
        {ACCEPTED_IMAGE_LABEL} · up to {formatBytes(MAX_UPLOAD_BYTES)}
        {hint ? ` · ${hint}` : ""}
      </p>

      {/*
        Announced, and it replaces nothing: an editor who cannot see the frame
        needs to be told which photograph is now selected, not only that one is.
      */}
      <output className="text-small text-ink">
        {chosen ? `${chosen.name} · ${formatBytes(chosen.size)}` : ""}
      </output>

      {error && (
        <p role="alert" className="text-small font-semibold text-red-text">
          {error}
        </p>
      )}
    </div>
  );
}
