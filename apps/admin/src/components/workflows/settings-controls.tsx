"use client";

import { useEffect, useState } from "react";

import { Field, Icon } from "@kedland/ui";

import { PRIMARY_BUTTON } from "./workflow-ui";

import { changePasswordAction } from "@/app/(dashboard)/actions";

const THEME_KEY = "kedland-admin-theme";
type ThemePreference = "light" | "dark" | "system";

const THEMES: readonly {
  value: ThemePreference;
  label: string;
  description: string;
  icon: string;
}[] = [
  { value: "light", label: "Light", description: "Bright and familiar", icon: "sun" },
  { value: "dark", label: "Dark", description: "Lower glare workspace", icon: "moon" },
  { value: "system", label: "System", description: "Match this device", icon: "monitor" },
];

function isTheme(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function applyThemePreference(preference: ThemePreference): void {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset["adminTheme"] = dark ? "dark" : "light";
}

export function AppearanceSettings() {
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const preference = isTheme(stored) ? stored : "system";
    applyThemePreference(preference);
    const restore = window.setTimeout(() => {
      setTheme(preference);
    }, 0);
    return () => {
      window.clearTimeout(restore);
    };
  }, []);

  const choose = (preference: ThemePreference): void => {
    setTheme(preference);
    window.localStorage.setItem(THEME_KEY, preference);
    applyThemePreference(preference);
    window.dispatchEvent(new CustomEvent("kedland-admin-theme"));
  };

  return (
    <section aria-labelledby="theme-heading" className="admin-panel rounded-lg p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="admin-settings-icon grid size-11 place-items-center rounded-md text-blue">
          <Icon name="palette" className="size-5" />
        </span>
        <div>
          <h2 id="theme-heading" className="text-h3">
            Theme
          </h2>
          <p className="mt-0.5 text-small text-grey">Choose how this dashboard appears on this device.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {THEMES.map((option) => {
          const selected = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                choose(option.value);
              }}
              className={`admin-theme-option relative flex min-h-40 flex-col items-center justify-center rounded-lg px-5 py-6 text-center ${
                selected ? "admin-theme-option-selected" : ""
              }`}
            >
              {selected && (
                <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-blue text-white">
                  <Icon name="star" className="size-4" />
                </span>
              )}
              <span className="admin-settings-icon grid size-12 place-items-center rounded-md text-blue">
                <Icon name={option.icon} className="size-6" />
              </span>
              <span className="mt-4 font-display text-lg font-bold text-navy">{option.label}</span>
              <span className="mt-1 text-small text-grey">{option.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function PasswordSettings({ embedded = false }: Readonly<{ embedded?: boolean }>) {
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [mismatch, setMismatch] = useState(false);

  const visibilityButton = (field: string, label: string) => (
    <button
      type="button"
      aria-label={`${visible[field] ? "Hide" : "Show"} ${label}`}
      aria-pressed={Boolean(visible[field])}
      onClick={() => {
        setVisible((current) => ({ ...current, [field]: !current[field] }));
      }}
      className={`admin-password-toggle grid size-10 place-items-center text-navy ${
        visible[field] ? "admin-password-toggle-pressed" : ""
      }`}
    >
      <Icon name={visible[field] ? "eye-off" : "eye"} className="size-5" />
    </button>
  );

  return (
    <form
      action={changePasswordAction}
      onSubmit={(event) => {
        const form = new FormData(event.currentTarget);
        const next = form.get("newPassword");
        const confirm = form.get("confirmPassword");
        const invalid = next !== confirm;
        setMismatch(invalid);
        if (invalid) event.preventDefault();
      }}
      className={embedded ? "grid gap-5" : "admin-panel rounded-lg p-5 sm:p-7"}
    >
      <div className="flex items-center gap-3">
        <span className="admin-settings-icon grid size-11 place-items-center rounded-md text-blue">
          <Icon name="shield" className="size-5" />
        </span>
        <div>
          <h2 className="text-h3">Change password</h2>
          <p className="mt-0.5 text-small text-grey">Changing it signs out every active device.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        <Field
          id="current-password"
          name="currentPassword"
          type={visible["current"] ? "text" : "password"}
          label="Current password"
          required
          autoComplete="current-password"
          startIcon={<Icon name="shield" className="size-5" />}
          endAction={visibilityButton("current", "current password")}
          className="admin-neu-field"
        />
        <Field
          id="new-password"
          name="newPassword"
          type={visible["new"] ? "text" : "password"}
          minLength={12}
          label="New password"
          required
          autoComplete="new-password"
          hint="Use at least 12 characters."
          startIcon={<Icon name="shield" className="size-5" />}
          endAction={visibilityButton("new", "new password")}
          className="admin-neu-field"
        />
        <Field
          id="confirm-password"
          name="confirmPassword"
          type={visible["confirm"] ? "text" : "password"}
          minLength={12}
          label="Confirm new password"
          required
          autoComplete="new-password"
          error={mismatch ? "The two new passwords do not match." : undefined}
          startIcon={<Icon name="shield" className="size-5" />}
          endAction={visibilityButton("confirm", "password confirmation")}
          className="admin-neu-field"
        />
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <p className="text-small text-grey">You will need to sign in again after this change.</p>
        <button type="submit" className={PRIMARY_BUTTON}>
          Update password
        </button>
      </div>
    </form>
  );
}

export const ADMIN_THEME_KEY = THEME_KEY;
