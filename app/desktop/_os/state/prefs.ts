// ashOS preferences, saved under their own localStorage key so they never
// touch the portfolio's `theme` setting.

import { APPS } from "../data/apps";
import { cleanChanges } from "../data/fs";
import { WALLPAPERS, type WallpaperId } from "../data/wallpapers";

export type Accent = "blue" | "purple" | "pink" | "red" | "orange" | "yellow" | "green" | "graphite";

export const ACCENTS: { id: Accent; name: string; light: string; dark: string }[] = [
  { id: "blue", name: "Blue", light: "#007aff", dark: "#0a84ff" },
  { id: "purple", name: "Purple", light: "#953d96", dark: "#a550a7" },
  { id: "pink", name: "Pink", light: "#e64b8e", dark: "#f74f9e" },
  { id: "red", name: "Red", light: "#e0383e", dark: "#ff5257" },
  { id: "orange", name: "Orange", light: "#f7821b", dark: "#f7821b" },
  { id: "yellow", name: "Yellow", light: "#e5a800", dark: "#ffc600" },
  { id: "green", name: "Green", light: "#4fa93b", dark: "#62ba46" },
  { id: "graphite", name: "Graphite", light: "#8c8c8c", dark: "#989898" },
];

export type Prefs = {
  appearance: "light" | "dark" | "auto";
  accent: Accent;
  wallpaper: WallpaperId;
  reduceTransparency: boolean;
  dockSize: number;
  dockMagnification: boolean;
  dockMagnify: number;
  dockPosition: "bottom" | "left" | "right";
  dockAutohide: boolean;
  dockIndicators: boolean;
  desktopIcons: boolean;
  desktopIconSize: number;
  desktopSort: "none" | "name" | "kind";
  finderView: "icons" | "list";
  finderSidebar: boolean;
  finderPreview: boolean;
  finderPathBar: boolean;
  doNotDisturb: boolean;
  wifi: boolean;
  brightness: number;
  terminalFontSize: number;
};

export const DEFAULT_PREFS: Prefs = {
  appearance: "auto",
  accent: "blue",
  wallpaper: "hills",
  reduceTransparency: false,
  dockSize: 50,
  dockMagnification: true,
  dockMagnify: 1.55,
  dockPosition: "bottom",
  dockAutohide: false,
  dockIndicators: true,
  desktopIcons: true,
  desktopIconSize: 60,
  desktopSort: "none",
  finderView: "icons",
  finderSidebar: true,
  finderPreview: false,
  finderPathBar: true,
  doNotDisturb: false,
  wifi: true,
  brightness: 1,
  terminalFontSize: 12.5,
};

export const KEYS = {
  prefs: "ashos:prefs",
  fs: "ashos:fs",
  recents: "ashos:recents",
  rects: "ashos:rects",
  icons: "ashos:icons",
  booted: "ashos:booted",
};

/* ---------- reading saved values back safely ---------- */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

// What each preference may be. Anything else falls back to its default.
const oneOf =
  <T,>(...ok: T[]) =>
  (v: unknown) =>
    ok.includes(v as T);
const bool = (v: unknown) => typeof v === "boolean";
const range = (min: number, max: number) => (v: unknown) => isNum(v) && v >= min && v <= max;
const PREF_OK: { [K in keyof Prefs]: (v: unknown) => boolean } = {
  appearance: oneOf("light", "dark", "auto"),
  accent: oneOf(...ACCENTS.map((a) => a.id)),
  wallpaper: oneOf(...WALLPAPERS.map((w) => w.id)),
  reduceTransparency: bool,
  dockSize: range(36, 72),
  dockMagnification: bool,
  dockMagnify: range(1.15, 2),
  dockPosition: oneOf("bottom", "left", "right"),
  dockAutohide: bool,
  dockIndicators: bool,
  desktopIcons: bool,
  desktopIconSize: range(44, 84),
  desktopSort: oneOf("none", "name", "kind"),
  finderView: oneOf("icons", "list"),
  finderSidebar: bool,
  finderPreview: bool,
  finderPathBar: bool,
  doNotDisturb: bool,
  wifi: bool,
  brightness: range(0.35, 1),
  terminalFontSize: range(10, 20),
};

function cleanPrefs(v: unknown): Prefs {
  const p: Obj = { ...DEFAULT_PREFS };
  if (isObj(v)) for (const k of Object.keys(PREF_OK) as (keyof Prefs)[]) if (PREF_OK[k](v[k])) p[k] = v[k];
  return p as Prefs;
}

/** A map of name → value, keeping only the entries `ok` accepts. */
const cleanMap =
  (ok: (k: string, v: unknown) => boolean) =>
  (v: unknown): Obj => {
    const out: Obj = {};
    if (isObj(v)) for (const [k, x] of Object.entries(v)) if (ok(k, x)) out[k] = x;
    return out;
  };
const isPoint = (v: unknown) => isObj(v) && isNum(v.x) && isNum(v.y);
const isRect = (v: unknown) => isPoint(v) && isNum((v as Obj).w) && isNum((v as Obj).h) && ((v as Obj).w as number) > 0 && ((v as Obj).h as number) > 0;

// Saved values may be anything (an older format, a hand edit, another tab
// mid-write), so each key is checked before the desktop uses it.
const CLEAN: Record<string, (v: unknown) => unknown> = {
  [KEYS.prefs]: cleanPrefs,
  [KEYS.fs]: cleanChanges,
  [KEYS.recents]: (v) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string"))].slice(0, 24) : []),
  [KEYS.rects]: cleanMap((k, v) => Object.prototype.hasOwnProperty.call(APPS, k) && isRect(v)),
  [KEYS.icons]: cleanMap((_, v) => isPoint(v)),
};

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v: unknown = JSON.parse(raw);
    const clean = CLEAN[key];
    if (clean) return clean(v) as T;
    // Unknown keys: at least the right kind of value.
    if (Array.isArray(fallback)) return (Array.isArray(v) ? v : fallback) as T;
    if (isObj(fallback)) return (isObj(v) ? { ...fallback, ...v } : fallback) as T;
    return typeof v === typeof fallback ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota: settings just won't persist */
  }
}

// sessionStorage throws when the browser blocks site data (Chrome's "Block
// all cookies"): then every visit is a first visit.
export function sessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function sessionSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* blocked: nothing to remember */
  }
}

/** The portfolio passes its theme in as ?theme= when it opens ashOS. */
export function hostTheme(): "light" | "dark" | null {
  try {
    const q = new URLSearchParams(location.search).get("theme");
    return q === "light" || q === "dark" ? q : null;
  } catch {
    return null;
  }
}
