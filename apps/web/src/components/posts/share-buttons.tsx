"use client";

import { useState } from "react";

/**
 * Share affordances for a published news post — agent_plan §6.4.
 *
 * WhatsApp, Facebook, X, LinkedIn, and copy-link. Each opens the platform's
 * share endpoint in a new tab (except copy, which stays on the page). The URL
 * must already be absolute — relative paths would share a broken link.
 */

interface ShareButtonsProps {
  url: string;
  title: string;
}

const BUTTON =
  "inline-flex size-11 items-center justify-center rounded-pill border border-navy/10 bg-white text-navy shadow-card transition-[transform,color,border-color] hover:-translate-y-0.5 hover:border-blue hover:text-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

function BrandIcon({ path }: Readonly<{ path: string }>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d={path} />
    </svg>
  );
}

function LineIcon({ path }: Readonly<{ path: string }>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d={path} />
    </svg>
  );
}

export function ShareButtons({ url, title }: Readonly<ShareButtonsProps>) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const shareText = encodeURIComponent(`${title} ${url}`);

  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Private browsing and older browsers can refuse clipboard write. The
      // button stays usable; we just do not claim success.
    }
  };

  return (
    <div>
      <p className="text-small font-bold uppercase tracking-[0.12em] text-grey">Share this story</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        <li>
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noreferrer noopener"
            className={BUTTON}
            aria-label="Share on WhatsApp"
          >
            <BrandIcon path="M12 2a10 10 0 00-8.6 15l-1.1 4 4.1-1.1A10 10 0 1012 2zm5.5 14.2c-.2.7-1.3 1.2-1.8 1.3-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-3.9-4.7-4.1-.2-.2-1.3-1.7-1.3-3.3 0-1.5.8-2.3 1.1-2.6.3-.3.6-.4.9-.4h.6c.2 0 .4 0 .6.5.2.6.8 2 .9 2.1.1.2.1.3 0 .5l-.4.7c-.1.2-.3.3-.1.6.1.3.6 1.1 1.4 1.8 1 .9 1.8 1.1 2.1 1.3.3.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1.2.1 1.6.8 1.9.9.3.2.5.2.6.3.1.2.1 1-.1 1.7z" />
          </a>
        </li>
        <li>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noreferrer noopener"
            className={BUTTON}
            aria-label="Share on Facebook"
          >
            <BrandIcon path="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />
          </a>
        </li>
        <li>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noreferrer noopener"
            className={BUTTON}
            aria-label="Share on X"
          >
            <BrandIcon path="M17.5 3h3l-6.6 7.5L22 21h-6.2l-4.9-6.4L5.7 21H2.7l7-8L2 3h6.3l4.4 5.8L17.5 3zm-1.1 16.2h1.7L7.7 4.7H5.9l10.5 14.5z" />
          </a>
        </li>
        <li>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noreferrer noopener"
            className={BUTTON}
            aria-label="Share on LinkedIn"
          >
            <BrandIcon path="M6.5 9H3.7v11h2.8V9zM5.1 3.5A1.6 1.6 0 103.5 5.1 1.6 1.6 0 005.1 3.5zM20.3 9c-1.9 0-3.1 1-3.6 2h-.1V9H14v11h2.8v-5.8c0-1.5.3-3 2.2-3s1.9 1.4 1.9 3.1V20H24v-6.3C24 10.7 22.7 9 20.3 9z" />
          </a>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              void copyLink();
            }}
            className={BUTTON}
            aria-label={copied ? "Link copied" : "Copy link"}
          >
            {copied ? (
              <LineIcon path="M5 12l4 4L19 6" />
            ) : (
              <LineIcon path="M10 13a5 5 0 007.5.4l2-2a5 5 0 00-7.1-7.1l-1.1 1.1M14 11a5 5 0 00-7.5-.4l-2 2a5 5 0 007.1 7.1l1.1-1.1" />
            )}
          </button>
        </li>
      </ul>
    </div>
  );
}
