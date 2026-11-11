// All GSAP/Lenis motion for the site, wired up from data attributes so the
// page components can stay mostly server-rendered. Loaded by <Motion /> with a
// dynamic import after hydration, and never under prefers-reduced-motion.
//
//   data-label    section label; slides up from behind its .mask parent
//   data-reveal   fades up 24px as it enters, staggered with its neighbours
//   data-words    children .w reveal word by word
//   data-tilt     3D tilt toward the cursor (max 3deg)
//   data-magnet   follows the cursor a few px, elastic return (value = max px)
//
// Only transform and opacity are animated. Elements are pre-hidden in CSS
// under html.motion (set before paint by the theme script), so nothing flashes.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const EASE = "power3.out";

let lenis: Lenis | null = null;
/** The running Lenis instance (null under reduced motion or before init). */
export const getLenis = () => lenis;

export function initMotion(): () => void {
  const root = document.documentElement;
  const cleanups: (() => void)[] = [];
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(type, fn as EventListener);
    cleanups.push(() => el.removeEventListener(type, fn as EventListener));
  };

  /* ---- 1. smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync ---- */
  const l = new Lenis({
    lerp: 0.1,
    anchors: true,
    autoRaf: false,
    // keep scrolling inside the ashOS iframe native
    prevent: (node) => node.nodeName === "IFRAME",
  });
  lenis = l;
  l.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => l.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // pause page scrolling while the ashOS takeover is open
  const mo = new MutationObserver(() => (root.dataset.ashos === "open" ? l.stop() : l.start()));
  mo.observe(root, { attributes: true, attributeFilter: ["data-ashos"] });

  // late layout shifts (fonts, now-playing) change trigger positions
  let refreshTimer = 0;
  const page = document.getElementById("page");
  const ro = new ResizeObserver(() => {
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
  });
  if (page) ro.observe(page);

  const ctx = gsap.context(() => {
    /* ---- 3. section labels: up from behind a mask ---- */
    ScrollTrigger.batch("[data-label]", {
      start: "top 90%",
      once: true,
      onEnter: (els) =>
        // y: 0 matters: GSAP reads the CSS pre-hide (translateY(105%)) as px y
        gsap.fromTo(els, { y: 0, yPercent: 105 }, { y: 0, yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.08 }),
    });

    /* ---- 3 + 5. content (incl. project cards): fade up 24px, staggered, once ---- */
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      interval: 0.12,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.08, clearProps: "transform" },
        ),
    });

    /* ---- 9. headline: word by word ---- */
    gsap.utils.toArray<HTMLElement>("[data-words]").forEach((el) => {
      gsap.fromTo(
        el.querySelectorAll(".w"),
        { opacity: 0, yPercent: 40 },
        {
          opacity: 1,
          yPercent: 0,
          duration: 0.8,
          ease: EASE,
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    });

    // Anything already scrolled past on load (reload mid-page) just shows.
    gsap.utils.toArray<HTMLElement>("[data-reveal], [data-label], [data-words] .w").forEach((el) => {
      if (el.getBoundingClientRect().bottom < 0) gsap.set(el, { opacity: 1, yPercent: 0, y: 0 });
    });
  });

  root.dataset.motionReady = "";

  /* ---- pointer effects: mouse / trackpad only ---- */
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) {
    /* 5. project cards: tilt toward the cursor, lift 4px */
    document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
      gsap.set(el, { transformPerspective: 1000 });
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: EASE });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: EASE });
      const y = gsap.quickTo(el, "y", { duration: 0.5, ease: EASE });
      on(el, "pointermove", (e) => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 6); // ±3deg
        rx((0.5 - (e.clientY - r.top) / r.height) * 6);
        y(-4);
      });
      on(el, "pointerleave", () => {
        rx(0);
        ry(0);
        y(0);
      });
    });

    /* 6. magnetic buttons: quickTo while inside, elastic return on leave */
    document.querySelectorAll<HTMLElement>("[data-magnet]").forEach((el) => {
      const max = Number(el.dataset.magnet) || 8;
      let xTo: gsap.QuickToFunc | null = null;
      let yTo: gsap.QuickToFunc | null = null;
      on(el, "pointerenter", () => {
        gsap.killTweensOf(el, "x,y");
        xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: EASE });
        yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: EASE });
      });
      on(el, "pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo?.(((e.clientX - r.left) / r.width - 0.5) * 2 * max);
        yTo?.(((e.clientY - r.top) / r.height - 0.5) * 2 * max * 0.85);
      });
      on(el, "pointerleave", () => {
        xTo = yTo = null;
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.5)", overwrite: true });
      });
    });
  }

  return () => {
    cleanups.forEach((fn) => fn());
    ctx.revert();
    document.querySelectorAll("[data-tilt], [data-magnet]").forEach((el) => {
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform" });
    });
    clearTimeout(refreshTimer);
    ro.disconnect();
    mo.disconnect();
    gsap.ticker.remove(tick);
    l.destroy();
    lenis = null;
    delete root.dataset.motionReady;
  };
}
