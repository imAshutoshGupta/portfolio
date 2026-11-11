// ashOS preferences, saved under their own localStorage key so they never
// touch the portfolio's `theme` setting.

import type { WallpaperId } from "../data/wallpapers";

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

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    if (fallback && typeof fallback === "object" && !Array.isArray(fallback)) return { ...fallback, ...v };
    return v as T;
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

/** The portfolio passes its theme in as ?theme= when it opens ashOS. */
export function hostTheme(): "light" | "dark" | null {
  try {
    const q = new URLSearchParams(location.search).get("theme");
    return q === "light" || q === "dark" ? q : null;
  } catch {
    return null;
  }
}
