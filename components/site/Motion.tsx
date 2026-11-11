"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { features } from "@/content";

// GSAP, ScrollTrigger and Lenis load in their own chunk once the page has
// loaded and the CSS hero intro is underway, so they stay off the critical
// path (first paint / LCP). Scroll-revealed content is pre-hidden by
// html.motion until then; it's below the fold, so nothing visible waits.
const Thread = dynamic(() => import("./Thread"), { ssr: false });

const EARLIEST = 1200; // ms after navigation; the hero intro runs ~2.2s

function afterLoad(fn: () => void) {
  let timer = 0;
  let idle = 0;
  const go = () => {
    timer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) idle = requestIdleCallback(fn, { timeout: 600 });
      else fn();
    }, Math.max(0, EARLIEST - performance.now()));
  };
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
  return () => {
    window.removeEventListener("load", go);
    clearTimeout(timer);
    if (idle) cancelIdleCallback(idle);
  };
}

export default function Motion() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // tells the pre-paint fallback in app/layout.tsx that motion is on its way
    if (!reduced) root.dataset.motionPending = "";
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const cancelWait = afterLoad(() => {
      setReady(true);
      if (reduced) return;
      import("./motionEngine")
        .then(({ initMotion }) => {
          if (!cancelled) cleanup = initMotion();
        })
        // chunk failed to load: show everything rather than leave it hidden
        .catch(() => root.classList.remove("motion"));
    });

    return () => {
      cancelled = true;
      cancelWait();
      cleanup?.();
      delete root.dataset.motionPending;
    };
  }, []);

  return features.thread && ready ? <Thread /> : null;
}
