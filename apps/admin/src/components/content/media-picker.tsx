"use client";

import Image from "next/image";

import { Icon } from "@kedland/ui";

export interface MediaPickerOption {
  value: string;
  label: string;
  imageUrl?: string | undefined;
}

/**
 * A visual media choice.
 *
 * Alt text remains visible as supporting context, but the image is the primary
 * control: editors should recognise the asset they are choosing instead of
 * having to infer it from a sentence in a dropdown.
 */
export function MediaPicker({
  id,
  name,
  label,
  options,
  value,
  defaultValue,
  required,
  onValueChange,
}: Readonly<{
  id: string;
  name?: string | undefined;
  label: string;
  options: readonly MediaPickerOption[];
  value?: string | undefined;
  defaultValue?: string | undefined;
  required?: boolean | undefined;
  onValueChange?: ((value: string) => void) | undefined;
}>) {
  const controlled = value !== undefined;

  return (
    <fieldset className="grid gap-3">
      <legend className="font-display text-small font-bold text-navy">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </legend>
      <div className="admin-media-picker-grid grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((option, index) => {
          const inputId = `${id}-${option.value}`;
          const shared = controlled ? { checked: value === option.value } : {};
          const initial = defaultValue ?? options[0]?.value;

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className="admin-media-choice group relative cursor-pointer overflow-hidden rounded-md"
            >
              <input
                id={inputId}
                type="radio"
                name={name ?? id}
                value={option.value}
                required={required && index === 0}
                className="peer sr-only"
                {...shared}
                {...(!controlled ? { defaultChecked: initial === option.value } : {})}
                onChange={() => {
                  onValueChange?.(option.value);
                }}
              />
              <span className="relative block aspect-[4/3] overflow-hidden bg-sky/30">
                {option.imageUrl ? (
                  <Image
                    src={option.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 45vw, 13rem"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-blue">
                    <Icon name="images" className="size-7" />
                  </span>
                )}
                <span className="admin-media-choice-check absolute right-2 top-2 grid size-7 place-items-center rounded-pill">
                  <Icon name="check" className="size-3.5" />
                </span>
              </span>
              <span className="line-clamp-2 min-h-12 px-3 py-2 text-[0.76rem] font-semibold leading-4 text-ink">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
