"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Icon } from "@kedland/ui";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";

export interface AdminSelectOption {
  value: string;
  label: string;
}

export function AdminSelectField({
  id,
  name,
  label,
  options,
  defaultValue,
  value,
  required = false,
  disabled = false,
  hint,
  onValueChange,
}: Readonly<{
  id: string;
  name?: string | undefined;
  label: string;
  options: AdminSelectOption[];
  defaultValue?: string | undefined;
  value?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  hint?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
}>) {
  const fallbackValue =
    defaultValue && options.some((option) => option.value === defaultValue)
      ? defaultValue
      : (options[0]?.value ?? "");
  const [internalValue, setInternalValue] = useState(fallbackValue);
  const [open, setOpen] = useState(false);
  const selectedValue = value ?? internalValue;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedValue),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = `${id}-listbox`;
  const labelId = `${id}-label`;
  const hintId = useId();

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
    };
  }, []);

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form || value !== undefined) return;

    const reset = (): void => {
      setInternalValue(fallbackValue);
      setActiveIndex(
        Math.max(
          0,
          options.findIndex((option) => option.value === fallbackValue),
        ),
      );
      setOpen(false);
    };

    form.addEventListener("reset", reset);
    return () => {
      form.removeEventListener("reset", reset);
    };
  }, [fallbackValue, options, value]);

  const select = (nextIndex: number): void => {
    const option = options[nextIndex];
    if (!option) return;
    if (value === undefined) setInternalValue(option.value);
    onValueChange?.(option.value);
    setActiveIndex(nextIndex);
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
      if (open) select(activeIndex);
      else {
        setActiveIndex(selectedIndex);
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  const selectedOption = options[selectedIndex];

  return (
    <div ref={rootRef} className="relative grid gap-1.5">
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
        aria-describedby={hint ? hintId : undefined}
        disabled={disabled}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
        className="admin-neu-field admin-select-trigger flex w-full items-center justify-between gap-4 border px-4 py-3 text-left text-ink transition"
      >
        <span className="min-w-0 truncate font-medium">{selectedOption?.label ?? "Choose an option"}</span>
        <span className="admin-select-chevron grid size-7 shrink-0 place-items-center rounded-md text-blue">
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
          className="admin-select-menu absolute left-0 right-0 top-[calc(100%_+_0.45rem)] z-50 max-h-64 overflow-y-auto rounded-md p-1.5"
        >
          {options.map((option, index) => {
            const selected = index === selectedIndex;
            const active = index === activeIndex;

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
                  select(index);
                }}
                className={`admin-select-option flex w-full items-center justify-between gap-4 rounded-md px-3.5 py-3 text-left text-small font-semibold transition ${
                  selected ? "admin-select-option-selected" : ""
                } ${active ? "admin-select-option-active" : ""}`}
              >
                <span>{option.label}</span>
                {selected && <Icon name="check" className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {hint && (
        <span id={hintId} className="text-small text-grey">
          {hint}
        </span>
      )}
    </div>
  );
}
