"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { nav, resumeLink } from "@/content";
import { AshOSLink } from "./AshOS";
import { onHashClick } from "./scroll";

/** Switches theme with a circle growing out of the toggle (View Transitions),
 *  a short colour fade where that API is missing, and instantly under reduced motion. */
function toggleTheme(e: MouseEvent<HTMLButtonElement>) {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  const apply = () => {
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();

  if (!document.startViewTransition) {
    root.classList.add("theme-fade");
    apply();
    window.setTimeout(() => root.classList.remove("theme-fade"), 500);
    return;
  }

  const r = e.currentTarget.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(.65,0,.35,1)", pseudoElement: "::view-transition-new(root)" },
    );
  });
}

const iconBtn =
  "flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-line bg-transparent text-fg";

function ThemeButton() {
  return (
    <button onClick={toggleTheme} aria-label={nav.toggleLabel} className={iconBtn}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
      </svg>
    </button>
  );
}

/** Hide on scroll down, show on scroll up; blurred backdrop once off the top. */
function useAutoHide(ref: React.RefObject<HTMLElement | null>, pinned: boolean) {
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const dy = y - last;
      nav.toggleAttribute("data-scrolled", y > 8);
      // keyboard focus in the nav keeps it on screen; a mouse click on a link doesn't
      if (reduced || pinnedRef.current || nav.querySelector(":focus-visible") || y < 160) {
        nav.removeAttribute("data-hidden");
      } else if (dy > 4) {
        nav.setAttribute("data-hidden", "");
      } else if (dy < -4) {
        nav.removeAttribute("data-hidden");
      }
      if (Math.abs(dy) > 4) last = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onFocus = () => nav.querySelector(":focus-visible") && nav.removeAttribute("data-hidden");
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    nav.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      nav.removeEventListener("focusin", onFocus);
    };
  }, [ref]);
}

export default function Nav() {
  const [menu, setMenu] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  useAutoHide(navRef, menu);

  // close the mobile menu if the viewport grows past the breakpoint
  useEffect(() => {
    if (!menu) return;
    const mq = window.matchMedia("(min-width: 861px)");
    const onChange = () => mq.matches && setMenu(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    mq.addEventListener("change", onChange);
    document.addEventListener("keydown", onKey);
    return () => {
      mq.removeEventListener("change", onChange);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const close = () => setMenu(false);

  return (
    <nav ref={navRef} className="site-nav flex flex-wrap items-center justify-between gap-4 border-b border-line p-[28px_0] max-sm:p-[20px_0]">
      <a href="#top" onClick={(e) => onHashClick(e)} className="flex items-center gap-3 no-underline">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 flex-col items-center justify-center gap-[3px] rounded-[8px] bg-fg"
        >
          <span className="breathe h-[6px] w-[6px] rounded-[9px] bg-accent-soft" />
          <span className="h-[9px] w-[5px] rounded-[4px_4px_4px_1px] bg-bg [transform:skewX(-12deg)]" />
        </span>
        <span className="font-semibold">{nav.name}</span>
      </a>

      {/* desktop links */}
      <div className="flex flex-wrap items-center gap-6 text-[15px] text-muted max-[860px]:hidden">
        {nav.items.map((l) => (
          <a key={l.href} href={l.href} onClick={(e) => onHashClick(e)} className="link no-underline">
            {l.label}
          </a>
        ))}
        <AshOSLink className="link font-mono text-[13px] no-underline">{nav.ashos}</AshOSLink>
        <a {...resumeLink} className="link text-fg no-underline">
          {nav.resume}
        </a>
        <ThemeButton />
      </div>

      {/* mobile: theme + menu button */}
      <div className="hidden items-center gap-2 max-[860px]:flex">
        <ThemeButton />
        <button
          onClick={() => setMenu((m) => !m)}
          aria-label={menu ? nav.menuClose : nav.menuOpen}
          aria-expanded={menu}
          aria-controls="mobile-menu"
          className={iconBtn}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            {menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>

      {menu && (
        <div id="mobile-menu" className="hidden basis-full max-[860px]:block">
          <ul className="m-0 list-none p-[4px_0_0] text-[20px] tracking-[-0.015em]">
            {nav.items.map((l) => (
              <li key={l.href} className="border-t border-line first:border-t-0">
                <a href={l.href} onClick={(e) => onHashClick(e, close)} className="block p-[14px_0] no-underline">
                  {l.label}
                </a>
              </li>
            ))}
            <li className="border-t border-line">
              <AshOSLink className="block p-[16px_0] font-mono text-[15px] text-muted no-underline">{nav.ashos}</AshOSLink>
            </li>
            <li className="border-t border-line">
              <a {...resumeLink} className="block p-[14px_0] no-underline">
                {nav.resume}
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
