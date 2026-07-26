"use client";

import { useState } from "react";

import { Icon } from "@kedland/ui";

import type { MouseEvent as ReactMouseEvent } from "react";

const THEME_KEY = "kedland-admin-theme";

export function AdminThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.dataset["adminTheme"] === "dark",
  );

  const toggle = (event: ReactMouseEvent<HTMLButtonElement>): void => {
    const next = !dark;
    const theme = next ? "dark" : "light";
    const apply = (): void => {
      window.localStorage.setItem(THEME_KEY, theme);
      document.documentElement.dataset["adminTheme"] = theme;
      window.dispatchEvent(new Event("kedland-admin-theme"));
      setDark(next);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY),
    );

    if (typeof document.startViewTransition === "function") {
      document.documentElement.dataset["adminThemeTransition"] = "";
      const transition = document.startViewTransition(apply);
      void transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${String(originX)}px ${String(originY)}px)`,
              `circle(${String(radius)}px at ${String(originX)}px ${String(originY)}px)`,
            ],
          },
          {
            duration: 620,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
      void transition.finished.finally(() => {
        delete document.documentElement.dataset["adminThemeTransition"];
      });
      return;
    }

    const overlay = document.createElement("span");
    overlay.className = "admin-theme-reveal";
    overlay.dataset["theme"] = theme;
    overlay.style.setProperty("--theme-origin-x", `${String(originX)}px`);
    overlay.style.setProperty("--theme-origin-y", `${String(originY)}px`);
    overlay.style.setProperty("--theme-reveal-radius", `${String(radius)}px`);
    document.body.append(overlay);
    let finished = false;
    const finish = (): void => {
      if (finished) return;
      finished = true;
      apply();
      overlay.dataset["settling"] = "";
      window.setTimeout(() => {
        overlay.remove();
      }, 160);
    };
    overlay.addEventListener("transitionend", finish, { once: true });
    requestAnimationFrame(() => {
      overlay.dataset["active"] = "";
    });
    window.setTimeout(finish, 760);
  };

  return (
    <button
      data-tour="theme"
      type="button"
      onClick={toggle}
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      title={dark ? "Use light theme" : "Use dark theme"}
      className="admin-icon-button grid size-11 place-items-center text-navy"
    >
      <span className="relative grid size-5 place-items-center">
        <Icon
          name="sun"
          className={`absolute size-5 transition-[opacity,transform] duration-300 motion-reduce:transition-none ${
            dark ? "rotate-0 opacity-100" : "rotate-90 opacity-0"
          }`}
        />
        <Icon
          name="moon"
          className={`absolute size-5 transition-[opacity,transform] duration-300 motion-reduce:transition-none ${
            dark ? "-rotate-90 opacity-0" : "rotate-0 opacity-100"
          }`}
        />
      </span>
    </button>
  );
}
