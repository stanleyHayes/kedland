"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "./icon";

import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  id: string;
  name?: string | undefined;
  label: string;
  options: SelectOption[];
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  startIcon?: ReactNode;
  className?: string | undefined;
}

/**
 * A branded, keyboard-operable replacement for the browser's native select.
 *
 * Focus stays on the trigger while `aria-activedescendant` announces the
 * highlighted option. A hidden input keeps ordinary FormData submissions
 * working, so adopting this control does not require a new form architecture.
 */
export function SelectField({
  id,
  name,
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  error,
  hint,
  required = false,
  disabled = false,
  startIcon,
  className = "",
}: Readonly<SelectFieldProps>) {
  const fallbackValue =
    defaultValue !== undefined && options.some((option) => option.value === defaultValue)
      ? defaultValue
      : (options[0]?.value ?? "");
  const [internalValue, setInternalValue] = useState(fallbackValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedValue = value ?? internalValue;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedValue),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form || value !== undefined) return;

    const reset = (): void => {
      setInternalValue(fallbackValue);
      setOpen(false);
    };
    form.addEventListener("reset", reset);
    return () => {
      form.removeEventListener("reset", reset);
    };
  }, [fallbackValue, value]);

  const choose = (index: number): void => {
    const option = options[index];
    if (!option) return;
    if (value === undefined) setInternalValue(option.value);
    onValueChange?.(option.value);
    setActiveIndex(index);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
    if (disabled || options.length === 0) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const origin = open ? activeIndex : selectedIndex;
      setActiveIndex((origin + direction + options.length) % options.length);
      setOpen(true);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : options.length - 1);
      setOpen(true);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(activeIndex);
      else {
        setActiveIndex(selectedIndex);
        setOpen(true);
      }
      return;
    }

    if (event.key === "Tab") setOpen(false);
  };

  const selectedOption = options[selectedIndex];

  return (
    <div ref={rootRef} className={`relative flex flex-col gap-1.5 ${className}`.trim()}>
      <span id={labelId} className="font-display font-bold text-navy">
        {label}
        {!required && <span className="ml-1.5 font-body font-normal text-grey">(optional)</span>}
      </span>

      {name && <input type="hidden" name={name} value={selectedOption?.value ?? ""} />}

      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${id}-option-${String(activeIndex)}` : undefined}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        disabled={disabled}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
        className={`flex min-h-14 w-full items-center gap-3 rounded-[0.625rem] border bg-white px-4 py-3.5 text-left text-ink shadow-[0_1px_0_rgba(20,78,113,0.04)] transition-[border-color,box-shadow,background-color] focus:outline-none focus-visible:ring-3 focus-visible:ring-blue/40 disabled:cursor-not-allowed disabled:bg-cream disabled:opacity-70 ${
          error ? "border-red focus-visible:border-red" : "border-sky focus-visible:border-blue"
        }`}
      >
        {startIcon && <span className="grid shrink-0 place-items-center text-blue">{startIcon}</span>}
        <span className="min-w-0 flex-1 truncate">{selectedOption?.label ?? "Choose an option"}</span>
        <span className="grid size-8 shrink-0 place-items-center rounded-pill border border-sky bg-cream text-navy">
          <Icon
            name="chevron-down"
            className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute left-0 right-0 top-[calc(100%_+_0.5rem)] z-50 max-h-72 overflow-y-auto rounded-md border border-sky bg-white p-2 shadow-[0_22px_50px_rgba(8,51,76,0.22)]"
        >
          {options.map((option, index) => {
            const selected = index === selectedIndex;
            const active = index === activeIndex;
            let optionTone = "text-ink hover:bg-sky/30";
            if (active) optionTone = "bg-sky/45 text-navy";
            if (selected) {
              optionTone = "bg-navy text-white shadow-[inset_3px_0_0_var(--color-yellow)]";
            }

            return (
              <button
                key={option.value}
                id={`${id}-option-${String(index)}`}
                type="button"
                role="option"
                aria-selected={selected}
                onPointerEnter={() => {
                  setActiveIndex(index);
                }}
                onClick={() => {
                  choose(index);
                }}
                className={`flex w-full items-center justify-between gap-4 rounded-sm px-4 py-3 text-left text-small font-semibold transition-colors ${optionTone}`}
              >
                <span>{option.label}</span>
                {selected && <Icon name="check" className="size-4 shrink-0 text-yellow" />}
              </button>
            );
          })}
        </div>
      )}

      {hint && (
        <span id={`${id}-hint`} className="text-small text-grey">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} role="alert" className="text-small font-semibold text-red-text">
          {error}
        </span>
      )}
    </div>
  );
}
