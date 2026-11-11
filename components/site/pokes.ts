"use client";

import { useSyncExternalStore } from "react";
import { footer } from "@/content";

// One shared poke count for the hero Semi and the footer counter.
// Pokes go up straight away on screen, and are sent to /api/pokes in small
// batches. Each visitor adds at most footer.pokes.perVisitor to the total.

type State = {
  /** Global total; null until loaded, or when the counter isn't set up. */
  total: number | null;
  /** Pokes this visitor has added so far (kept in localStorage). */
  given: number;
};

const CAP = footer.pokes.perVisitor;
const GIVEN_KEY = "semi:pokes-given";
const SERVER: State = { total: null, given: 0 };

let state: State = SERVER;
let started = false;
let pending = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  let given = 0;
  try {
    given = Math.min(CAP, Math.max(0, Number(localStorage.getItem(GIVEN_KEY)) || 0));
  } catch {}
  set({ given });
  fetch("/api/pokes", { cache: "no-store" })
    .then((r) => r.json() as Promise<{ count: number | null }>)
    .then(({ count }) => set({ total: count === null ? null : count + pending }))
    .catch(() => {});
  window.addEventListener("pagehide", () => flush(true));
}

function flush(leaving = false) {
  clearTimeout(timer);
  if (!pending) return;
  const n = pending;
  pending = 0;
  fetch("/api/pokes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ n }),
    keepalive: leaving,
  })
    .then((r) => r.json() as Promise<{ count: number | null }>)
    .then(({ count }) => {
      if (count !== null) set({ total: count + pending });
    })
    .catch(() => {});
}

/** Counts one poke. Returns false once this visitor has used up their pokes. */
export function poke(): boolean {
  start();
  if (state.given >= CAP) return false;
  const given = state.given + 1;
  try {
    localStorage.setItem(GIVEN_KEY, String(given));
  } catch {}
  pending++;
  set({ given, total: state.total === null ? null : state.total + 1 });
  clearTimeout(timer);
  timer = setTimeout(flush, 800);
  return true;
}

function subscribe(l: () => void) {
  start();
  listeners.add(l);
  return () => listeners.delete(l);
}

export function usePokes() {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER);
  return { ...s, tired: s.given >= CAP };
}
