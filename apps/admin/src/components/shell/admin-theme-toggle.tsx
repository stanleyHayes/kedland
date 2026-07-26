"use client";

import { useState } from "react";

import { Icon } from "@kedland/ui";

const THEME_KEY = "kedland-admin-theme";

export function AdminThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.dataset["adminTheme"] === "dark",
  );

  const toggle = (): void => {
    const next = !dark;
    window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    document.documentElement.dataset["adminTheme"] = next ? "dark" : "light";
    window.dispatchEvent(new Event("kedland-admin-theme"));
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      title={dark ? "Use light theme" : "Use dark theme"}
      className="admin-icon-button grid size-11 place-items-center text-navy"
    >
      <Icon name={dark ? "sun" : "moon"} className="size-5" />
    </button>
  );
}
