"use client";

import { useEffect, useRef, type PointerEvent as RPointerEvent } from "react";

const HOLD = 500;
const SLOP = 8;

/**
 * Touch long-press for context menus: iOS Safari never fires contextmenu.
 * Returns a pointerdown handler. After a still ~500ms hold it calls
 * onPress(x, y, target), then swallows the click (and any late contextmenu)
 * the lift sends, until the next press. Where the browser does fire its own
 * contextmenu first (Android), that one wins and the timer stops.
 */
export function useLongPress(onPress: (x: number, y: number, target: HTMLElement) => void) {
  const press = useRef(onPress);
  useEffect(() => {
    press.current = onPress;
  });
  const end = useRef<(() => void) | null>(null);
  useEffect(() => () => end.current?.(), []);

  return (e: RPointerEvent) => {
    end.current?.();
    if (e.pointerType !== "touch" || !e.isPrimary) return;
    const { pointerId: id, clientX: sx, clientY: sy } = e;
    const target = e.target as HTMLElement;
    let held = false;
    const timer = setTimeout(() => {
      held = true;
      press.current(sx, sy, target);
    }, HOLD);
    const move = (ev: PointerEvent) => {
      if (!held && ev.pointerId === id && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > SLOP) stop();
    };
    const lift = (ev: PointerEvent) => {
      if (!held && ev.pointerId === id) stop();
    };
    const block = (ev: Event) => {
      if (!held) return void (ev.type === "contextmenu" && stop());
      ev.preventDefault();
      ev.stopPropagation();
    };
    const stop = () => {
      clearTimeout(timer);
      removeEventListener("pointermove", move, true);
      removeEventListener("pointerup", lift, true);
      removeEventListener("pointercancel", lift, true);
      removeEventListener("click", block, true);
      removeEventListener("contextmenu", block, true);
      removeEventListener("pointerdown", stop, true);
      end.current = null;
    };
    addEventListener("pointermove", move, true);
    addEventListener("pointerup", lift, true);
    addEventListener("pointercancel", lift, true);
    addEventListener("click", block, true);
    addEventListener("contextmenu", block, true);
    addEventListener("pointerdown", stop, true);
    end.current = stop;
  };
}
