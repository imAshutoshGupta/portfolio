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

/**
 * A native smooth scroll started before Lenis loaded. Setting Lenis up (and
 * ScrollTrigger's first refresh) cuts that scroll short, leaving the page
 * partway, so Lenis finishes the trip once it's ready. Any scroll input from
 * the visitor in the meantime cancels it: they've taken over.
 */
let pending: { target: number | HTMLElement; until: number } | null = null;
const TAKEOVER = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
const cancelPending = () => {
  pending = null;
};

export function setLenis(l: LenisLike | null) {
  lenis = l;
  const p = pending;
  pending = null;
  if (!l || !p || performance.now() > p.until) return;
  // wait a frame so the rest of the motion setup has run first
  requestAnimationFrame(() => {
    if (lenis !== l) return;
    l.sync();
    l.scrollTo(p.target);
  });
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
    if (smooth) {
      pending = { target: top ? 0 : el!, until: performance.now() + 4000 };
      // `once` + the same handler means re-adding never stacks listeners
      TAKEOVER.forEach((t) => window.addEventListener(t, cancelPending, { once: true, passive: true }));
    }
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
