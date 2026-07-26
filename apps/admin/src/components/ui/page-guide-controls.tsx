"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@kedland/ui";

export function PageGuideControls({
  title,
  description,
  help,
}: Readonly<{ title: string; description?: string; help: string }>) {
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent): void => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
    };
  }, [open]);

  useEffect(
    () => () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  const listen = (): void => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance([title, description, help].filter(Boolean).join(". "));
    utterance.lang = "en-GH";
    utterance.rate = 0.92;
    utterance.onend = () => {
      setSpeaking(false);
    };
    utterance.onerror = () => {
      setSpeaking(false);
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <div ref={root} className="relative inline-flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
        }}
        aria-expanded={open}
        aria-label={`Help for ${title}`}
        className="admin-icon-button grid size-9 place-items-center text-navy"
      >
        <Icon name="book" className="size-4" />
      </button>
      <button
        type="button"
        onClick={listen}
        aria-pressed={speaking}
        aria-label={speaking ? "Stop listening" : `Listen to the ${title} guide`}
        className={`admin-icon-button grid size-9 place-items-center text-navy ${speaking ? "text-blue" : ""}`}
      >
        <Icon name={speaking ? "close" : "music"} className="size-4" />
      </button>
      {open && (
        <section
          role="dialog"
          aria-label={`${title} help`}
          className="admin-page-guide absolute left-0 top-[calc(100%+0.65rem)] z-40 w-[min(24rem,calc(100vw-2rem))] rounded-lg p-4"
        >
          <p className="font-display font-bold text-navy">How to use this page</p>
          <p className="mt-2 text-small leading-relaxed text-grey">{help}</p>
          <button
            type="button"
            onClick={listen}
            className="mt-4 inline-flex items-center gap-2 text-small font-bold text-blue"
          >
            <Icon name="music" className="size-4" />
            {speaking ? "Stop listening" : "Listen to this guide"}
          </button>
        </section>
      )}
    </div>
  );
}
