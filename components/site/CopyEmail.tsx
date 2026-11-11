"use client";

import { useEffect, useRef, useState } from "react";
import { footer, links } from "@/content";

/** Copies the email address; says "Copied" for a moment and tells screen readers. */
export default function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.emailLabel);
    } catch {
      return; // no clipboard access (insecure context, denied): the mailto link still works
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={footer.copyEmailLabel}
        className="inline-flex cursor-pointer items-center gap-[5px] rounded-[6px] border-0 bg-transparent p-[3px_6px] font-mono text-[11px] text-muted transition-colors hover:bg-soft hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-[11px] w-[11px]" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
          {copied ? (
            <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" />
          ) : (
            <>
              <rect x="5" y="5" width="8.5" height="8.5" rx="2" />
              <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
            </>
          )}
        </svg>
        {copied ? footer.copiedEmail : footer.copyEmail}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? footer.copiedStatus : ""}
      </span>
    </>
  );
}
