// Window manager state: a pure reducer plus geometry helpers.

import { APPS, type AppArgs, type AppId } from "../data/apps";

export type WinMode = "normal" | "zoomed" | "fullscreen";
export type Phase = "opening" | "open" | "closing" | "minimizing" | "restoring";
export type Rect = { x: number; y: number; w: number; h: number };

export type Win = Rect & {
  id: string;
  app: AppId;
  args: AppArgs;
  title: string;
  z: number;
  mode: WinMode;
  minimized: boolean;
  phase: Phase;
};

export type WmState = { wins: Win[]; z: number; focused: string | null; seq: number };

export const initialWm: WmState = { wins: [], z: 10, focused: null, seq: 0 };

export type WmAction =
  | { type: "open"; app: AppId; args: AppArgs; rect: Rect; instant: boolean }
  | { type: "focus"; id: string }
  | { type: "focusApp"; app: AppId }
  | { type: "focusDesktop" }
  | { type: "phaseDone"; id: string }
  | { type: "close"; id: string; instant: boolean }
  | { type: "minimize"; id: string; instant: boolean }
  | { type: "restore"; id: string; instant: boolean }
  | { type: "rect"; id: string; rect: Rect }
  | { type: "mode"; id: string; mode: WinMode }
  | { type: "title"; id: string; title: string }
  | { type: "args"; id: string; args: AppArgs }
  | { type: "clamp"; bounds: { w: number; h: number; top: number } };

const live = (w: Win) => w.phase !== "closing";
const visible = (w: Win) => live(w) && !w.minimized && w.phase !== "minimizing";

/** The topmost visible window, if any. */
export function topWindow(wins: Win[], except?: string): Win | null {
  let best: Win | null = null;
  for (const w of wins) if (w.id !== except && visible(w) && (!best || w.z > best.z)) best = w;
  return best;
}

const patch = (s: WmState, id: string, p: Partial<Win>): Win[] => s.wins.map((w) => (w.id === id ? { ...w, ...p } : w));

export function wmReducer(s: WmState, a: WmAction): WmState {
  switch (a.type) {
    case "open": {
      const seq = s.seq + 1;
      const z = s.z + 1;
      const id = `${a.app}-${seq}`;
      const win: Win = {
        id,
        app: a.app,
        args: a.args,
        title: APPS[a.app].name,
        ...a.rect,
        z,
        mode: "normal",
        minimized: false,
        phase: a.instant ? "open" : "opening",
      };
      return { wins: [...s.wins, win], z, seq, focused: id };
    }
    case "focus": {
      const w = s.wins.find((x) => x.id === a.id);
      if (!w || !live(w)) return s;
      if (s.focused === a.id && w.z === s.z) return s;
      const z = s.z + 1;
      return { ...s, z, focused: a.id, wins: patch(s, a.id, { z }) };
    }
    case "focusApp": {
      // Bring every visible window of the app forward, keeping their order.
      const mine = s.wins.filter((w) => w.app === a.app && visible(w)).sort((x, y) => x.z - y.z);
      if (!mine.length) return s;
      let z = s.z;
      const zs = new Map(mine.map((w) => [w.id, ++z]));
      return {
        ...s,
        z,
        focused: mine[mine.length - 1].id,
        wins: s.wins.map((w) => (zs.has(w.id) ? { ...w, z: zs.get(w.id)! } : w)),
      };
    }
    case "focusDesktop":
      return s.focused === null ? s : { ...s, focused: null };
    case "phaseDone": {
      const w = s.wins.find((x) => x.id === a.id);
      if (!w) return s;
      if (w.phase === "closing") return { ...s, wins: s.wins.filter((x) => x.id !== a.id) };
      if (w.phase === "minimizing") return { ...s, wins: patch(s, a.id, { phase: "open", minimized: true }) };
      if (w.phase === "opening" || w.phase === "restoring") return { ...s, wins: patch(s, a.id, { phase: "open" }) };
      return s;
    }
    case "close": {
      const next = topWindow(s.wins, a.id);
      const wins = a.instant ? s.wins.filter((w) => w.id !== a.id) : patch(s, a.id, { phase: "closing" });
      return { ...s, wins, focused: s.focused === a.id ? next?.id ?? null : s.focused };
    }
    case "minimize": {
      const w = s.wins.find((x) => x.id === a.id);
      if (!w || !visible(w)) return s;
      const next = topWindow(s.wins, a.id);
      return {
        ...s,
        wins: patch(s, a.id, a.instant ? { minimized: true, phase: "open" } : { phase: "minimizing" }),
        focused: s.focused === a.id ? next?.id ?? null : s.focused,
      };
    }
    case "restore": {
      const w = s.wins.find((x) => x.id === a.id);
      if (!w || !live(w)) return s;
      const z = s.z + 1;
      const phase: Phase = w.minimized && !a.instant ? "restoring" : "open";
      return { ...s, z, focused: a.id, wins: patch(s, a.id, { minimized: false, phase, z }) };
    }
    case "rect":
      return { ...s, wins: patch(s, a.id, a.rect) };
    case "mode":
      return { ...s, wins: patch(s, a.id, { mode: a.mode }) };
    case "title": {
      const w = s.wins.find((x) => x.id === a.id);
      return !w || w.title === a.title ? s : { ...s, wins: patch(s, a.id, { title: a.title }) };
    }
    case "args":
      return { ...s, wins: patch(s, a.id, { args: a.args }) };
    case "clamp": {
      let changed = false;
      const wins = s.wins.map((w) => {
        const r = clampRect(w, a.bounds);
        if (r.x === w.x && r.y === w.y && r.w === w.w && r.h === w.h) return w;
        changed = true;
        return { ...w, ...r };
      });
      return changed ? { ...s, wins } : s;
    }
  }
}

/** Keep a window reachable: its title bar stays on screen and it fits the viewport. */
export function clampRect(r: Rect, b: { w: number; h: number; top: number }): Rect {
  const w = Math.min(r.w, b.w);
  const h = Math.min(r.h, b.h - b.top);
  const x = Math.min(Math.max(r.x, 100 - w), b.w - 100);
  const y = Math.min(Math.max(r.y, b.top), b.h - 60);
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}
