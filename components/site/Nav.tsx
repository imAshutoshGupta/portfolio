"use client";

import { useEffect, useRef, useState } from "react";
import { nav, resumeLink } from "@/content";
import { AshOSLink } from "./AshOS";
import Bulb from "./Bulb";
import { nudgeScroll, onHashClick } from "./scroll";

/** Space kept between the nav and a focused element it would otherwise cover. */
const FOCUS_GAP = 8;

const iconBtn =
  "flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-line bg-transparent text-fg";

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

    // Keyboard focus never ends up under the shown nav (WCAG 2.4.11). The
    // browser scrolls a focused element just into view, which on the way up
    // (Shift+Tab) is right under the nav as it slides back in. Two frames
    // later the scroll and the nav's show/hide have settled; if the nav
    // covers the element, the page scrolls back just enough to clear it.
    // (Not scroll-padding-top on <html>: Lenis subtracts it from every jump.)
    let focusFrame = 0;
    const onPageFocus = (e: FocusEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || nav.contains(el) || el.closest('[role="dialog"]')) return;
      // only what comes after the nav (the skip link sits on top of it)
      if (!(nav.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => {
        focusFrame = requestAnimationFrame(() => {
          focusFrame = 0;
          if (document.activeElement !== el || !el.matches(":focus-visible") || nav.hasAttribute("data-hidden")) return;
          // where the nav's bottom edge ends up, even mid-slide
          const t = getComputedStyle(nav).transform;
          const slide = t && t !== "none" ? new DOMMatrixReadOnly(t).m42 : 0;
          const navBottom = nav.getBoundingClientRect().bottom - slide;
          const r = el.getBoundingClientRect();
          if (r.top < navBottom && r.bottom > 0) nudgeScroll(r.top - navBottom - FOCUS_GAP);
        });
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    nav.addEventListener("focusin", onFocus);
    document.addEventListener("focusin", onPageFocus);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("scroll", onScroll);
      nav.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusin", onPageFocus);
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
        <Bulb top={28} />
      </div>

      {/* mobile: bulb + menu button */}
      <div className="hidden items-center gap-2 max-[860px]:flex">
        <Bulb top={20} />
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

      {/* Without JS the menu button can't open, so phones get the links as a
          plain row instead (site.css hides the dead button). With JS this
          renders nothing. */}
      <noscript className="hidden basis-full max-[860px]:block">
        <span className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-muted">
          {nav.items.map((l) => (
            <a key={l.href} href={l.href} className="link no-underline">
              {l.label}
            </a>
          ))}
          <AshOSLink className="link font-mono text-[13px] no-underline">{nav.ashos}</AshOSLink>
          <a {...resumeLink} className="link text-fg no-underline">
            {nav.resume}
          </a>
        </span>
      </noscript>
    </nav>
  );
}
