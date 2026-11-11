// In-page scrolling for every "#..." link (logo, nav, mobile menu, hero CTA).
// Kept tiny and free of GSAP/Lenis imports so the nav can use it before the
// deferred motion bundle (motionEngine.ts) has loaded; once it has, it
// registers its Lenis instance here and jumps go through lenis.scrollTo.

/** What scroll.ts needs from Lenis (motionEngine.ts passes an adapter). */
export type LenisLike = {
  scrollTo: (target: number | HTMLElement) => void;
  /** set animated/target scroll to the real scroll position, stop any glide */
  sync: () => void;
};

let lenis: LenisLike | null = null;

export function setLenis(l: LenisLike | null) {
  lenis = l;
}

/**
 * Re-reads the real scroll position into Lenis. Lenis ignores native scroll
 * events while it is running its own smooth scroll, and scrollTo() is a no-op
 * when the target equals its (possibly stale) targetScroll, so without this
 * the logo could fail to return to the top after a scrollbar drag, a keyboard
 * scroll or a scripted `scrollTop = …`.
 */
function syncLenis() {
  if (!lenis) return;
  lenis.sync();
}

/** Scroll to "#top" / "#" (the very top) or the element a hash points at. */
function scrollToHash(hash: string) {
  const top = hash === "#" || hash === "#top";
  const el = top ? null : document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!top && !el) return false;

  if (lenis) {
    syncLenis();
    lenis.scrollTo(top ? 0 : el!);
  } else {
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const y = top ? 0 : el!.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" });
  }
  if (!top) history.replaceState(null, "", hash);
  else if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  return true;
}

/** Click handler for in-page links; leaves modified clicks to the browser. */
export function onHashClick(e: React.MouseEvent<HTMLAnchorElement>, before?: () => void) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  const hash = e.currentTarget.getAttribute("href") ?? "";
  if (!hash.startsWith("#")) return;
  e.preventDefault();
  if (before) {
    before();
    // let the mobile menu collapse first so the target's position is final
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToHash(hash)));
  } else {
    scrollToHash(hash);
  }
}
