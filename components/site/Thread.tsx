"use client";

// The v4 "thread": a thin line in the left gutter that draws itself as you
// scroll (ScrollTrigger scrub), led by a glowing dot, and ends in a semicolon
// beside the footer headline. Hidden under 1100px (site.css).
//
// Geometry follows the source: x = 58 + 22·sin(y/280), sampled every 40px
// from y=140. The end is anchored to the footer's real position instead of
// the source's fixed 6000px canvas.

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const X = (y: number) => 58 + 22 * Math.sin(y / 280);
const TOP = 140;
const END_BELOW_FOOTER = 110; // footer padding-top ≈ headline top

type Geo = { bot: number; height: number };

export default function Thread() {
  const [geo, setGeo] = useState<Geo | null>(null);
  const drawRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const endRef = useRef<SVGGElement>(null);

  // track the page and footer positions
  useEffect(() => {
    const page = document.getElementById("page");
    const foot = page?.querySelector("footer");
    if (!page || !foot) return;
    const measure = () => {
      const bot = Math.round(foot.getBoundingClientRect().top - page.getBoundingClientRect().top + END_BELOW_FOOTER);
      setGeo((g) => (g && g.bot === bot && g.height === page.offsetHeight ? g : { bot, height: page.offsetHeight }));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(page);
    return () => ro.disconnect();
  }, []);

  const bot = geo?.bot ?? 0;

  useEffect(() => {
    if (!geo) return;
    const render = (prog: number) => {
      const dy = TOP + (bot - TOP) * prog;
      drawRef.current?.setAttribute("stroke-dashoffset", (1 - prog).toFixed(4));
      if (dotRef.current) gsap.set(dotRef.current, { x: X(dy), y: dy });
      const done = prog > 0.97;
      endRef.current?.classList.toggle("lit", done);
      // the lead dot hands over to the semicolon's own dot instead of sitting on it
      dotRef.current?.classList.toggle("done", done);
    };

    // Reduced motion: no scrubbing, just the finished line.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      render(1);
      return;
    }

    const state = { p: 0.05 };
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      onUpdate: () => render(state.p),
      scrollTrigger: { start: 0, end: "max", scrub: 0.6 },
    });
    render(0.05 + 0.95 * (tween.scrollTrigger?.progress ?? 0));
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [geo, bot]);

  if (!geo) return null;

  let d = "M " + X(TOP).toFixed(1) + " " + TOP;
  for (let y = TOP + 40; y <= bot; y += 40) d += " L " + X(y).toFixed(1) + " " + y;
  const endY = bot + 20;
  const endX = X(endY).toFixed(1);
  const svgH = endY + 80;

  return (
    <div className="thread pointer-events-none absolute top-0 left-0 w-[120px]" style={{ height: svgH }} aria-hidden="true">
      <svg width="120" height={svgH} viewBox={`0 0 120 ${svgH}`} className="absolute inset-0">
        <path d={d} fill="none" stroke="var(--line)" strokeWidth="1.5" />
        <path ref={drawRef} d={d} fill="none" stroke="var(--accent)" strokeWidth="2" pathLength={1} strokeDasharray="1" strokeDashoffset="0.95" />
        {/* the semicolon: dot + comma tail */}
        <g ref={endRef} className="thread-end">
          <circle cx={endX} cy={endY} r="9" fill="var(--accent)" />
          <path
            d={`M ${endX} ${endY + 22} q 10 0 10 12 q 0 16 -16 26`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <span ref={dotRef} className="thread-dot absolute top-0 left-0 m-[-6px_0_0_-6px] h-3 w-3 rounded-[99px] bg-accent" />
    </div>
  );
}
