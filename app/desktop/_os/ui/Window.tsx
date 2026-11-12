"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
  type ReactNode,
} from "react";
import { APPS } from "../data/apps";
import { MENUBAR_H, useOS } from "../state/os";
import type { Rect, Win } from "../state/wm";

type WinCtx = { win: Win; active: boolean };
const WinContext = createContext<WinCtx | null>(null);
export const useWin = () => useContext(WinContext)!;

const INTERACTIVE = "button, input, textarea, select, a, [role=button], [data-nodrag]";
const DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;
type Dir = (typeof DIRS)[number];

/** A title bar / toolbar region that drags the window. */
export function DragRegion({ className, children, label }: { className: string; children?: ReactNode; label?: string }) {
  return (
    <div className={className} data-drag="" aria-label={label}>
      {children}
    </div>
  );
}

/** Slim title bar (Terminal, Preview, Résumé). */
export function TitleBar({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <DragRegion className="ashos-titlebar">
      <span className="ashos-titlebar__title">{title}</span>
      {children && <div className="ashos-titlebar__tools">{children}</div>}
    </DragRegion>
  );
}

function TrafficLights({ win, active }: { win: Win; active: boolean }) {
  const os = useOS();
  const full = win.mode === "fullscreen";
  return (
    <div className={"ashos-lights" + (active ? "" : " is-idle")} data-nodrag="">
      <button type="button" className="ashos-light ashos-light--close" aria-label={`Close ${win.title}`} title="Close" onClick={() => os.close(win.id)}>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3.6 3.6l4.8 4.8M8.4 3.6 3.6 8.4" />
        </svg>
      </button>
      <button
        type="button"
        className="ashos-light ashos-light--min"
        aria-label={`Minimise ${win.title}`}
        title="Minimise"
        disabled={full}
        onClick={() => os.minimize(win.id)}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.8 6h6.4" />
        </svg>
      </button>
      <button
        type="button"
        className="ashos-light ashos-light--zoom"
        aria-label={full ? `Exit full screen` : `Enter full screen (Option-click to zoom)`}
        title={full ? "Exit Full Screen" : "Full Screen (⌥-click to Zoom)"}
        onClick={(e) => (e.altKey ? os.toggleZoom(win.id) : os.toggleFullscreen(win.id))}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          {full ? <path d="M6.9 2.6v2.5h2.5M5.1 9.4V6.9H2.6" className="fill" /> : <path d="M3.1 7.6V3.1h4.5zM8.9 4.4v4.5H4.4z" className="fill" />}
        </svg>
      </button>
    </div>
  );
}

export function Window({ win, children }: { win: Win; children: ReactNode }) {
  const os = useOS();
  const ref = useRef<HTMLElement>(null);
  const active = os.focused?.id === win.id;
  const def = APPS[win.app];
  const frame = os.frameOf(win);
  const locked = os.mobile || win.mode === "fullscreen";

  /* ---- open / close / minimise / restore animations (WAAPI) ---- */
  const { phase, id } = win;
  const { phaseDone, reduced } = os;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || phase === "open") return;
    if (reduced) {
      phaseDone(id);
      return;
    }
    el.getAnimations().forEach((a) => a.cancel());
    const toDock = () => {
      const r = el.getBoundingClientRect();
      const t =
        document.querySelector(`[data-dock-app="${win.app}"]`) ?? document.querySelector("[data-dock-trash]");
      const tr = t?.getBoundingClientRect();
      const dx = tr ? tr.left + tr.width / 2 - (r.left + r.width / 2) : 0;
      const dy = tr ? tr.top + tr.height / 2 - (r.top + r.height / 2) : innerHeight;
      return `translate(${dx}px, ${dy}px) scale(${Math.max(0.04, 48 / r.width)}, ${Math.max(0.04, 48 / r.height)})`;
    };
    let anim: Animation;
    if (phase === "opening")
      anim = el.animate(
        [
          { opacity: 0, transform: "scale(.94) translateY(6px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
    else if (phase === "closing")
      anim = el.animate(
        [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: "scale(.95)" },
        ],
        { duration: 170, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" }
      );
    else if (phase === "minimizing")
      anim = el.animate(
        [
          { opacity: 1, transform: "none" },
          { opacity: 0.35, transform: toDock() },
        ],
        { duration: 360, easing: "cubic-bezier(.55,0,.75,.25)", fill: "forwards" }
      );
    else
      anim = el.animate(
        [
          { opacity: 0.35, transform: toDock() },
          { opacity: 1, transform: "none" },
        ],
        { duration: 340, easing: "cubic-bezier(.2,.8,.25,1)" }
      );
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      phaseDone(id);
    };
    anim.onfinish = finish;
    // Safety net: background tabs can pause animations.
    const t = setTimeout(finish, 700);
    return () => clearTimeout(t);
  }, [phase, id, reduced, phaseDone, win.app]);

  // Clear the forward-filled minimise transform once the window is shown again.
  useEffect(() => {
    if (!win.minimized && phase === "open") ref.current?.getAnimations().forEach((a) => a.cancel());
  }, [win.minimized, phase]);

  // Keyboard focus follows the active window, unless something inside it
  // (Terminal's prompt, a field) already took it.
  useEffect(() => {
    const el = ref.current;
    if (active && el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
  }, [active]);

  /* ---- animate between normal / zoomed / full screen ---- */
  const [morph, setMorph] = useState(false);
  const prevMode = useRef(win.mode);
  useEffect(() => {
    if (prevMode.current === win.mode) return;
    prevMode.current = win.mode;
    if (reduced) return;
    setMorph(true);
    const t = setTimeout(() => setMorph(false), 320);
    return () => clearTimeout(t);
  }, [win.mode, reduced]);

  /* ---- drag & resize (direct DOM updates, committed on release) ---- */
  const startGesture = useCallback(
    (e: RPointerEvent, kind: "move" | Dir) => {
      const el = ref.current;
      if (!el) return;
      e.preventDefault();
      // preventDefault() also stops the click moving keyboard focus, so move it here.
      if (!el.contains(document.activeElement)) el.focus({ preventScroll: true });
      os.focus(win.id);
      const root = el.closest(".ashos") as HTMLElement | null;
      let r: Rect = { ...frame };
      const fromZoom = win.mode === "zoomed";
      const sx = e.clientX;
      const sy = e.clientY;
      let moved = false;
      let next: Rect = r;
      const min = { w: Math.min(def.min[0], innerWidth), h: Math.min(def.min[1], innerHeight - MENUBAR_H) };
      const target = e.currentTarget as HTMLElement;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {}

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - sx;
        const dy = ev.clientY - sy;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
        if (!moved) {
          moved = true;
          root?.setAttribute("data-gesture", kind === "move" ? "move" : "resize");
          if (fromZoom) {
            // Un-zoom under the cursor, like dragging a maximised window.
            const w = win.w;
            const h = win.h;
            r = { x: sx - (sx - r.x) * (w / r.w), y: r.y, w, h };
            os.setRect(win.id, r);
            os.toggleZoom(win.id);
          }
        }
        if (kind === "move") {
          next = {
            ...r,
            x: Math.min(Math.max(r.x + dx, 100 - r.w), innerWidth - 100),
            y: Math.min(Math.max(r.y + dy, MENUBAR_H), innerHeight - 60),
          };
        } else {
          let { x, y, w, h } = r;
          if (kind.includes("e")) w = Math.max(min.w, Math.min(r.w + dx, innerWidth - r.x));
          if (kind.includes("s")) h = Math.max(min.h, Math.min(r.h + dy, innerHeight - r.y));
          if (kind.includes("w")) {
            w = Math.max(min.w, r.w - dx);
            x = r.x + r.w - w;
          }
          if (kind.includes("n")) {
            const top = Math.max(MENUBAR_H, r.y + dy);
            h = Math.max(min.h, r.y + r.h - top);
            y = r.y + r.h - h;
          }
          next = { x, y, w, h };
        }
        el.style.left = next.x + "px";
        el.style.top = next.y + "px";
        el.style.width = next.w + "px";
        el.style.height = next.h + "px";
      };
      const onUp = () => {
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onUp);
        root?.removeAttribute("data-gesture");
        if (moved) os.setRect(win.id, { x: Math.round(next.x), y: Math.round(next.y), w: Math.round(next.w), h: Math.round(next.h) });
      };
      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onUp);
    },
    [os, win, frame, def]
  );

  // Double-click on the title bar zooms. Detected here because the drag
  // gesture's preventDefault() suppresses the browser's own dblclick.
  const lastDown = useRef({ t: 0, x: 0, y: 0 });
  const onPointerDown = (e: RPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (!t.closest("[data-drag]") || t.closest(INTERACTIVE)) return;
    const now = performance.now();
    const prev = lastDown.current;
    lastDown.current = { t: now, x: e.clientX, y: e.clientY };
    if (now - prev.t < 400 && Math.abs(e.clientX - prev.x) < 5 && Math.abs(e.clientY - prev.y) < 5) {
      lastDown.current.t = 0;
      if (!os.mobile && win.mode !== "fullscreen") os.toggleZoom(win.id);
      return;
    }
    if (locked) return;
    startGesture(e, "move");
  };

  const hidden = win.minimized && phase !== "restoring";
  const cls =
    "ashos-win" +
    ` ashos-win--${def.chrome}` +
    (active ? " is-active" : "") +
    (win.mode !== "normal" || os.mobile ? " is-filled" : "") +
    (win.mode === "fullscreen" ? " is-fullscreen" : "") +
    (morph ? " is-morphing" : "") +
    (hidden ? " is-hidden" : "");

  return (
    <WinContext.Provider value={{ win, active }}>
      <section
        ref={ref}
        className={cls}
        data-app={win.app}
        style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h, zIndex: win.z }}
        role="dialog"
        aria-label={win.title}
        aria-hidden={hidden || undefined}
        tabIndex={-1}
        onPointerDownCapture={() => {
          if (!active) os.focus(win.id);
        }}
        onPointerDown={onPointerDown}
      >
        <TrafficLights win={win} active={active} />
        <div className="ashos-win__content">{children}</div>
        {!locked && win.mode === "normal" &&
          DIRS.map((d) => (
            <div key={d} className={`ashos-resize ashos-resize--${d}`} onPointerDown={(e) => e.button === 0 && startGesture(e, d)} aria-hidden="true" />
          ))}
      </section>
    </WinContext.Provider>
  );
}
