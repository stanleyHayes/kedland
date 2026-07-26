"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@kedland/ui";

import type { CSSProperties } from "react";

interface TourStep {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  targets?: readonly string[];
}

const FIRST_STEP: TourStep = {
  eyebrow: "Welcome to Kedland",
  title: "Your workspace, at a glance",
  description:
    "This short tour shows you where to publish updates, respond to families and manage the school website.",
  icon: "sparkle",
};

const STEPS: readonly TourStep[] = [
  FIRST_STEP,
  {
    eyebrow: "Step 1",
    title: "Everything starts in the navigation",
    description:
      "Open a group to reveal its tools. The active page stays highlighted, and badges point to work that needs attention.",
    icon: "blocks",
    targets: ['[data-tour="sidebar"]', '[data-tour="mobile-nav"]'],
  },
  {
    eyebrow: "Step 2",
    title: "See what needs a response",
    description:
      "The notification bell gathers new enquiries, unfinished posts and media consent gaps in one place.",
    icon: "bell",
    targets: ['[data-tour="attention"]'],
  },
  {
    eyebrow: "Step 3",
    title: "Make the workspace comfortable",
    description:
      "Switch between light and dark themes at any time. Your choice is remembered on this device.",
    icon: "palette",
    targets: ['[data-tour="theme"]'],
  },
  {
    eyebrow: "One last thing",
    title: "Your account tools stay close",
    description:
      "Profile, security and workspace settings live in this menu. You can also replay this tour from here whenever you need it.",
    icon: "user",
    targets: ['[data-tour="account"]'],
  },
] as const;

interface HighlightRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function onboardingTourStorageKey(email: string): string {
  return `kedland-admin-tour-v1:${email.trim().toLocaleLowerCase()}`;
}

function firstVisibleTarget(selectors: readonly string[] | undefined): HTMLElement | null {
  if (!selectors) return null;

  for (const selector of selectors) {
    const candidates = document.querySelectorAll<HTMLElement>(selector);
    for (const candidate of candidates) {
      const rect = candidate.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return candidate;
    }
  }
  return null;
}

function rectOf(target: HTMLElement): HighlightRect {
  const rect = target.getBoundingClientRect();
  const padding = 8;
  return {
    top: Math.max(8, rect.top - padding),
    left: Math.max(8, rect.left - padding),
    right: Math.min(window.innerWidth - 8, rect.right + padding),
    bottom: Math.min(window.innerHeight - 8, rect.bottom + padding),
    width: Math.min(window.innerWidth - 16, rect.width + padding * 2),
    height: Math.min(window.innerHeight - 16, rect.height + padding * 2),
  };
}

function cardPosition(rect: HighlightRect | null): CSSProperties {
  const margin = 16;
  const gap = 18;
  const cardWidth = Math.min(384, window.innerWidth - margin * 2);

  if (!rect || window.innerWidth < 720) {
    return {
      left: margin,
      right: margin,
      bottom: margin,
      width: "auto",
    };
  }

  const maxTop = Math.max(margin, window.innerHeight - 350);
  const alignedTop = Math.min(maxTop, Math.max(margin, rect.top));

  if (rect.right + gap + cardWidth <= window.innerWidth - margin) {
    return { left: rect.right + gap, top: alignedTop, width: cardWidth };
  }

  if (rect.left - gap - cardWidth >= margin) {
    return { left: rect.left - gap - cardWidth, top: alignedTop, width: cardWidth };
  }

  const left = Math.min(window.innerWidth - cardWidth - margin, Math.max(margin, rect.left));
  if (rect.bottom + gap + 330 <= window.innerHeight) {
    return { left, top: rect.bottom + gap, width: cardWidth };
  }

  return { left, bottom: window.innerHeight - rect.top + gap, width: cardWidth };
}

function progressClass(index: number, current: number): string {
  if (index === current) return "w-8 bg-blue";
  if (index < current) return "w-3 bg-green";
  return "w-3 bg-sky";
}

export function OnboardingTour({
  userEmail,
  replaySignal,
}: Readonly<{
  userEmail: string;
  replaySignal: number;
}>) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const storageKey = onboardingTourStorageKey(userEmail);
  const step = STEPS[stepIndex] ?? FIRST_STEP;

  const complete = useCallback((): void => {
    try {
      window.localStorage.setItem(storageKey, "complete");
    } catch {
      // A blocked storage API should not trap someone inside the tour.
    }
    setOpen(false);
    setStepIndex(0);
    setHighlight(null);
  }, [storageKey]);

  useEffect(() => {
    let completed = false;
    try {
      completed = window.localStorage.getItem(storageKey) === "complete";
    } catch {
      // Continue with the first-run tour when storage is unavailable.
    }
    if (completed) return;

    const show = window.setTimeout(() => {
      setOpen(true);
    }, 0);
    return () => {
      window.clearTimeout(show);
    };
  }, [storageKey]);

  useEffect(() => {
    if (replaySignal === 0) return;
    const replay = window.setTimeout(() => {
      setStepIndex(0);
      setOpen(true);
    }, 0);
    return () => {
      window.clearTimeout(replay);
    };
  }, [replaySignal]);

  useEffect(() => {
    if (!open) return;

    const target = firstVisibleTarget(step.targets);
    if (!target) {
      const clear = window.requestAnimationFrame(() => {
        setHighlight(null);
      });
      return () => {
        window.cancelAnimationFrame(clear);
      };
    }

    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const measure = (): void => {
      setHighlight(rectOf(target));
    };
    measure();
    const settle = window.setTimeout(measure, 280);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [open, stepIndex]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        complete();
        return;
      }

      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!controls || controls.length === 0) return;
      const first = controls[0];
      const lastControl = controls[controls.length - 1];
      if (event.shiftKey && first?.matches(":focus")) {
        event.preventDefault();
        lastControl?.focus();
      } else if (!event.shiftKey && lastControl?.matches(":focus")) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [complete, open]);

  if (!open) return null;

  const last = stepIndex === STEPS.length - 1;

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] ${highlight ? "" : "bg-navy-deep/76 backdrop-blur-[1px]"}`}
        aria-hidden="true"
      />
      {highlight && (
        <div
          className="admin-tour-spotlight pointer-events-none fixed z-[71] rounded-lg border-2 border-yellow"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
          }}
          aria-hidden="true"
        />
      )}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-tour-title"
        aria-describedby="admin-tour-description"
        aria-live="polite"
        tabIndex={-1}
        className="admin-tour-card fixed z-[72] overflow-hidden rounded-lg border border-sky/70 bg-cream text-ink shadow-[0_28px_80px_rgb(3_24_36/0.42)] outline-none"
        style={cardPosition(highlight)}
      >
        <div className="flex items-start gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <span className="admin-tour-icon grid size-12 shrink-0 place-items-center rounded-md bg-navy text-yellow">
            <Icon name={step.icon} className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-blue">
              {step.eyebrow}
            </p>
            <h2 id="admin-tour-title" className="mt-1 text-h3">
              {step.title}
            </h2>
          </div>
        </div>

        <p id="admin-tour-description" className="px-5 text-small leading-relaxed text-grey sm:px-6">
          {step.description}
        </p>

        <div className="mt-5 flex items-center gap-1.5 px-5 sm:px-6" aria-label="Tour progress">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={`h-1.5 rounded-pill transition-[width,background-color] duration-200 ${progressClass(
                index,
                stepIndex,
              )}`}
              aria-hidden="true"
            />
          ))}
          <span className="ml-auto text-[0.72rem] font-bold tabular-nums text-grey">
            {String(stepIndex + 1)} of {String(STEPS.length)}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-sky/55 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={complete}
            className="rounded-sm px-2 py-2 text-small font-bold text-grey transition hover:text-navy"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStepIndex((current) => Math.max(0, current - 1));
                }}
                className="admin-tour-back rounded-md border border-sky bg-white px-4 py-2.5 text-small font-bold text-navy transition hover:border-blue hover:text-blue"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (last) complete();
                else setStepIndex((current) => Math.min(STEPS.length - 1, current + 1));
              }}
              className="flex items-center gap-2 rounded-md bg-navy px-4 py-2.5 font-display text-small font-bold text-white shadow-[0_8px_18px_rgb(11_74_109/0.2)] transition hover:-translate-y-0.5 hover:bg-navy-deep active:translate-y-0"
            >
              {last ? "Start working" : "Next"}
              <Icon name={last ? "check" : "chevron-right"} className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
