"use client";

import { useCallback, useEffect, useId, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { nav } from "@/content";

/*
  The theme switch: a bulb hanging from the top edge of the viewport (the nav's
  top edge, which is sticky at 0). Lights on = light theme, off = dark.

  The cord is a Verlet rope: ROPE points from the fixed anchor down to the
  socket, plus one heavy point for the bulb's centre of mass. Distance
  constraints keep the segments at length, a soft constraint stops the bulb
  folding flat against the cord, and per-step damping lets it settle. The loop
  only runs while something is moving.
*/

type Pt = { x: number; y: number; px: number; py: number; w: number }; // w = inverse mass

const ROPE = 6; // anchor … socket
const COM = 16; // socket → bulb centre of mass
const MID = 13; // socket → visual middle of the bulb (sits on the slot's centre)
const GLASS = 17.5; // socket → centre of the glass
const G = 1600; // px/s²
const STEP = 1 / 120;
const DAMP = 0.985; // per step: a full swing settles in ~4s
const ITER = 12;
const KICK = 170; // px/s on click (~11px swing)
const NUDGE = 45; // px/s on hover

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A quick second switch (Enter twice) skips the running transition, sometimes
// before its update has run. So the theme still to apply, the transition that
// owns the vt-* classes and the light's clip animation are kept here: the
// second switch flips the right theme, the first can't strip the classes the
// second needs, and the first's half-run clip doesn't carry over onto the
// second's views (it targets the same pseudo-elements).
let queued: { theme: string } | null = null;
let current: ViewTransition | null = null;
let light: Animation | null = null;

/** Same theme system as before (data-theme + localStorage). With View
 *  Transitions, the light spreads out of the bulb when it turns on and
 *  draws back into it when it turns off; the bulb itself stays live on top. */
function switchTheme(x: number, y: number) {
  const root = document.documentElement;
  const next = (queued?.theme ?? root.getAttribute("data-theme")) === "dark" ? "light" : "dark";
  const me = { theme: next };
  queued = me;
  const apply = () => {
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    if (queued === me) queued = null;
  };

  if (reducedMotion()) return apply();

  if (!document.startViewTransition) {
    root.classList.add("theme-fade");
    apply();
    window.setTimeout(() => root.classList.remove("theme-fade"), 500);
    return;
  }

  const on = next === "light";
  root.classList.add("vt-bulb");
  root.classList.toggle("vt-off", !on);
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const small = `circle(0px at ${x}px ${y}px)`;
  const big = `circle(${radius}px at ${x}px ${y}px)`;
  light?.cancel();
  const t = document.startViewTransition(apply);
  current = t;
  t.ready
    .then(() => {
      light = root.animate(
        { clipPath: on ? [small, big] : [big, small] },
        {
          duration: on ? 900 : 700,
          easing: on ? "cubic-bezier(.25,.75,.3,1)" : "cubic-bezier(.65,0,.35,1)",
          fill: "forwards",
          pseudoElement: on ? "::view-transition-new(root)" : "::view-transition-old(root)",
        },
      );
    })
    .catch(() => {}); // skipped by a newer switch, which animates instead
  t.finished.finally(() => {
    if (current !== t) return;
    current = null;
    root.classList.remove("vt-bulb", "vt-off");
  });
}

function link(a: Pt, b: Pt, rest: number, k: number, pushOnly = false) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1e-6;
  if (pushOnly && d >= rest) return;
  const w = a.w + b.w;
  if (!w) return;
  const f = ((d - rest) / d / w) * k;
  a.x += dx * f * a.w;
  a.y += dy * f * a.w;
  b.x -= dx * f * b.w;
  b.y -= dy * f * b.w;
}

function restRope(len: number): Pt[] {
  const seg = len / (ROPE - 1);
  const pts: Pt[] = [];
  for (let i = 0; i < ROPE; i++) {
    const y = i * seg;
    pts.push({ x: 0, y, px: 0, py: y, w: i === 0 ? 0 : i === ROPE - 1 ? 0.45 : 0.55 });
  }
  const y = len + COM;
  pts.push({ x: 0, y, px: 0, py: y, w: 0.3 });
  return pts;
}

const f2 = (n: number) => Math.round(n * 100) / 100;

/** Smooth path through the rope points (Catmull-Rom as cubic Béziers). */
function cordPath(p: Pt[]) {
  let d = `M${f2(p[0].x)} ${f2(p[0].y)}`;
  for (let i = 0; i < ROPE - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(ROPE - 1, i + 2)];
    d += ` C${f2(p1.x + (p2.x - p0.x) / 6)} ${f2(p1.y + (p2.y - p0.y) / 6)} ${f2(p2.x - (p3.x - p1.x) / 6)} ${f2(p2.y - (p3.y - p1.y) / 6)} ${f2(p2.x)} ${f2(p2.y)}`;
  }
  return d;
}

function bodyTransform(p: Pt[]) {
  const s = p[ROPE - 1];
  const c = p[ROPE];
  const deg = (-Math.atan2(c.x - s.x, c.y - s.y) * 180) / Math.PI;
  return `translate(${f2(s.x)} ${f2(s.y)}) rotate(${f2(deg)})`;
}

/** `top` is the slot's distance below the nav's top edge before JS measures it. */
export default function Bulb({ top }: { top: number }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const cordRef = useRef<SVGPathElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const [anchor, setAnchor] = useState(top); // distance from the nav's top edge to the button's top
  const [lit, setLit] = useState<boolean | null>(null);
  const gradId = useId().replace(/:/g, "");

  const len = anchor + 20 - MID; // cord length: bulb's middle lands on the 40px slot's centre
  const sim = useRef({ pts: restRope(len), len, raf: 0, last: 0, acc: 0, still: 0, dir: 1 });

  const draw = useCallback(() => {
    const p = sim.current.pts;
    cordRef.current?.setAttribute("d", cordPath(p));
    bodyRef.current?.setAttribute("transform", bodyTransform(p));
  }, []);

  const step = useCallback(() => {
    const s = sim.current;
    const p = s.pts;
    const seg = s.len / (ROPE - 1);
    for (let i = 1; i < p.length; i++) {
      const q = p[i];
      const vx = (q.x - q.px) * DAMP;
      const vy = (q.y - q.py) * DAMP;
      q.px = q.x;
      q.py = q.y;
      q.x += vx;
      q.y += vy + G * STEP * STEP;
    }
    for (let n = 0; n < ITER; n++) {
      for (let i = 0; i < ROPE - 1; i++) link(p[i], p[i + 1], seg, 1);
      link(p[ROPE - 1], p[ROPE], COM, 1);
      // the socket end of a real cord is stiff: resist the bulb folding sideways
      link(p[ROPE - 2], p[ROPE], seg + COM, 0.22, true);
    }
  }, []);

  const tick = useCallback(
    (t: number) => {
      const s = sim.current;
      s.raf = 0;
      s.acc += Math.min(0.05, (t - s.last) / 1000);
      s.last = t;
      while (s.acc >= STEP) {
        step();
        s.acc -= STEP;
      }
      draw();
      let v = 0;
      let x = 0;
      for (const q of s.pts) {
        v = Math.max(v, Math.abs(q.x - q.px) + Math.abs(q.y - q.py));
        x = Math.max(x, Math.abs(q.x));
      }
      s.still = v < 0.008 && x < 0.3 ? s.still + 1 : 0;
      if (s.still > 20) {
        // at rest: snap the last fraction of a pixel and stop the loop
        s.pts = restRope(s.len);
        s.acc = 0;
        draw();
        return;
      }
      s.raf = requestAnimationFrame(tick);
    },
    [draw, step],
  );

  const kick = useCallback(
    (v: number) => {
      const s = sim.current;
      const p = s.pts;
      // strike the bulb only; the cord gets dragged along and bends behind it
      p[ROPE].px = p[ROPE].x - v * STEP;
      p[ROPE - 1].px = p[ROPE - 1].x - v * 0.6 * STEP;
      s.still = 0;
      if (!s.raf) {
        s.last = performance.now();
        s.raf = requestAnimationFrame(tick);
      }
    },
    [tick],
  );

  /** Screen position of the glass centre, wherever the swing has taken it. */
  const glassPoint = () => {
    const r = svgRef.current!.getBoundingClientRect();
    const p = sim.current.pts;
    const s = p[ROPE - 1];
    const c = p[ROPE];
    const k = GLASS / COM;
    return { x: r.left + 60 + s.x + (c.x - s.x) * k, y: r.top + s.y + (c.y - s.y) * k };
  };

  // measure where the slot sits under the nav's top edge; re-measure on resize
  useEffect(() => {
    const measure = () => {
      const btn = btnRef.current;
      const navEl = btn?.closest("nav");
      if (!btn || !navEl || !btn.offsetParent) return;
      setAnchor(Math.round(btn.getBoundingClientRect().top - navEl.getBoundingClientRect().top));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const s = sim.current;
    if (s.len === len) return;
    s.len = len;
    s.pts = restRope(len);
    draw();
  }, [len, draw]);

  // the label follows the theme, whoever changed it
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setLit(root.getAttribute("data-theme") === "light");
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(sim.current.raf);
      sim.current.raf = 0;
    };
  }, []);

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    const g = glassPoint();
    if (!reducedMotion()) {
      const s = sim.current;
      // a pointer pushes the bulb away from where it struck; keys alternate sides
      const away = e.detail > 0 ? Math.sign(g.x - e.clientX) : 0;
      s.dir = away || -s.dir;
      kick(s.dir * KICK);
    }
    switchTheme(g.x, g.y);
  };

  const onPointerEnter = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse" || reducedMotion()) return;
    kick((Math.sign(glassPoint().x - e.clientX) || 1) * NUDGE);
  };

  const label = lit === null ? nav.lightsToggle : lit ? nav.lightsOff : nav.lightsOn;
  const rest = restRope(len);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      aria-label={label}
      title={label}
      className="bulb-btn relative h-10 w-10 shrink-0 cursor-pointer border-0 bg-transparent p-0"
    >
      <svg
        ref={svgRef}
        className="bulb-svg pointer-events-none absolute left-[calc(50%-60px)] overflow-visible"
        style={{ top: -anchor }}
        width="120"
        height="110"
        viewBox="-60 0 120 110"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={gradId}>
            <stop offset="0" stopColor="#ffc56b" stopOpacity=".45" />
            <stop offset=".45" stopColor="#ffd28a" stopOpacity=".16" />
            <stop offset="1" stopColor="#ffd28a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path ref={cordRef} className="cord" d={cordPath(rest)} fill="none" strokeWidth="1" strokeLinecap="round" />
        <g ref={bodyRef} transform={bodyTransform(rest)} className="pointer-events-auto">
          <circle className="bloom" cx="0" cy={GLASS} r="44" fill={`url(#${gradId})`} pointerEvents="none" />
          <path
            className="glass"
            d={`M-3.2 8C-3.2 10.6-8.5 11.6-8.5 ${GLASS}A8.5 8.5 0 0 0 8.5 ${GLASS}C8.5 11.6 3.2 10.6 3.2 8Z`}
            strokeWidth="1"
          />
          <path className="fil" d="M-2 8.5V15.2M2 8.5V15.2M-2 15.2q.67-1.7 1.33 0t1.33 0t1.34 0" fill="none" strokeWidth=".9" strokeLinecap="round" />
          <rect className="socket" x="-3.8" y="0" width="7.6" height="8.4" rx="1.4" />
          <path className="socket-ridge" d="M-3.8 3H3.8M-3.8 5.6H3.8" strokeWidth=".7" />
        </g>
      </svg>
    </button>
  );
}
