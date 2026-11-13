"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ashos, links } from "@/content";

const OPEN_EVENT = "ashos:open";

/** A link that opens the ashOS takeover. Plain /desktop link without JS or on modified clicks. */
export function AshOSLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <a
      href={links.ashos}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        // Framed (the site inside ashOS's Safari): a takeover here would be
        // ashOS inside ashOS. Follow the link instead; Safari sees /desktop
        // and shows its "already in ashOS" card.
        if (window.top !== window.self) return;
        e.preventDefault();
        window.dispatchEvent(new Event(OPEN_EVENT));
      }}
    >
      {children}
    </a>
  );
}

/** Full-screen ashOS desktop, loaded in an iframe (unchanged from the previous site). */
export function AshOSTakeover() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const exitRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onOpen = () => {
      setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
      setOpen(true);
    };
    // The desktop posts this from its "Exit to site" menu item.
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data === "ashos:exit") close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("message", onMessage);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("message", onMessage);
      document.removeEventListener("keydown", onKey);
    };
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.dataset.ashos = "open";
    // Everything but the dialog goes inert while it's open (the skip link,
    // nav, page, thread and whatever else sits in <body>), so Tab, Shift+Tab
    // and screen readers can't wander onto the page it covers. The dialog
    // lives inside #page, so that's every sibling on the way up to <body>,
    // not #page itself. Only what this sets is unset, before focus goes back.
    const inerted: HTMLElement[] = [];
    for (let el: HTMLElement | null = dialogRef.current; el && el !== document.body; el = el.parentElement) {
      for (const sib of el.parentElement?.children ?? []) {
        if (sib === el || !(sib instanceof HTMLElement) || sib.inert) continue;
        if (sib instanceof HTMLScriptElement || sib instanceof HTMLStyleElement || sib instanceof HTMLLinkElement) continue;
        sib.inert = true;
        inerted.push(sib);
      }
    }
    exitRef.current?.focus();
    return () => {
      inerted.forEach((el) => (el.inert = false));
      document.documentElement.style.overflow = "";
      delete document.documentElement.dataset.ashos;
      // The opener may be gone (e.g. a mobile-menu link, if the window grew
      // past the menu's breakpoint meanwhile): then the page's main landmark.
      if (prev?.isConnected) prev.focus?.();
      else document.getElementById("main")?.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      ref={dialogRef}
      className="os-in fixed inset-0 z-[300] flex flex-col bg-bg"
      role="dialog"
      aria-modal="true"
      aria-label={ashos.dialogLabel}
    >
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,.12)] bg-[#08070d] px-4 py-[9px]">
        <span className="flex items-center gap-[9px] font-mono text-[12px] text-[#9b97ad]">
          <span className="h-2 w-2 rounded-full bg-[#1ed760] shadow-[0_0_8px_#1ed760]" /> {ashos.status}
        </span>
        <button
          ref={exitRef}
          onClick={close}
          className="cursor-pointer rounded-lg border border-[rgba(255,255,255,.22)] bg-[rgba(255,255,255,.1)] px-[15px] py-[7px] font-mono text-[12px] text-white transition-all duration-200 hover:bg-[rgba(255,255,255,.2)]"
        >
          {ashos.exit}
        </button>
      </div>
      <iframe
        title={ashos.frameTitle}
        src={`${links.ashos}?theme=${theme}`}
        className="w-full flex-1 border-none bg-[#0c0a16]"
      />
    </div>
  );
}
