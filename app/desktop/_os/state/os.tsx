"use client";

// The ashOS "kernel": preferences, file system, window manager and shared UI
// state, exposed to every app through one context.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { APPS, type AppArgs, type AppId, type SettingsPane } from "../data/apps";
import {
  applyChanges,
  BASE_FS,
  basename,
  dirname,
  join,
  NO_CHANGES,
  TRASH,
  uniqueName,
  type Fs,
  type FsChanges,
  type FsNode,
} from "../data/fs";
import { DEFAULT_PREFS, hostTheme, KEYS, load, save, type Prefs } from "./prefs";
import { clampRect, initialWm, topWindow, wmReducer, type Rect, type Win, type WinMode } from "./wm";

export const MENUBAR_H = 28;
export const MOBILE_BP = 760;

export type MenuItem =
  | { sep: true }
  | {
      sep?: false;
      label: string;
      run?: () => void;
      disabled?: boolean;
      checked?: boolean;
      shortcut?: string;
      submenu?: MenuItem[];
    };
export type MenuSection = { title: string; items: MenuItem[] };

export type Note = { id: number; app: AppId; title: string; body: string; run?: () => void };
export type CtxMenu = { x: number; y: number; items: MenuItem[] };
export type Overlay = "spotlight" | "control" | "notifications" | "switcher" | null;

type LaunchOpts = { newWindow?: boolean; rect?: Rect };

export type OS = {
  /* system */
  prefs: Prefs;
  setPref: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void;
  resetPrefs: () => void;
  appearance: "light" | "dark";
  viewport: { w: number; h: number };
  mobile: boolean;
  reduced: boolean;
  area: Rect;
  bootedAt: number;
  /** Whether /resume.pdf ships with the site (null = unknown). */
  resumeAvailable: boolean | null;
  /* files */
  fs: Fs;
  recents: string[];
  openPath: (path: string) => void;
  createFolder: (dir: string) => string | null;
  rename: (path: string, name: string) => string | null;
  moveToTrash: (path: string) => void;
  emptyTrash: () => void;
  canModify: (path: string) => boolean;
  /* windows */
  wins: Win[];
  focused: Win | null;
  activeApp: AppId;
  launch: (app: AppId, args?: AppArgs, opts?: LaunchOpts) => void;
  focus: (id: string) => void;
  focusDesktop: () => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  toggleZoom: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  setRect: (id: string, r: Rect) => void;
  setTitle: (id: string, title: string) => void;
  setArgs: (id: string, args: AppArgs) => void;
  phaseDone: (id: string) => void;
  quit: (app: AppId) => void;
  hideApp: (app: AppId) => void;
  hideOthers: (app: AppId) => void;
  frameOf: (w: Win) => Rect;
  runningApps: AppId[];
  bouncing: AppId[];
  /* menus */
  registerMenus: (winId: string, get: () => MenuSection[]) => void;
  unregisterMenus: (winId: string) => void;
  menusFor: (winId: string | null) => MenuSection[];
  /* shell UI */
  overlay: Overlay;
  setOverlay: (o: Overlay) => void;
  ctx: CtxMenu | null;
  openContextMenu: (x: number, y: number, items: MenuItem[]) => void;
  closeContextMenu: () => void;
  quickLook: string | null;
  setQuickLook: (path: string | null) => void;
  notes: Note[];
  notify: (n: Omit<Note, "id">) => void;
  dismiss: (id: number) => void;
  openSettings: (pane?: SettingsPane) => void;
  exitToPortfolio: () => void;
};

const Ctx = createContext<OS | null>(null);

export function useOS(): OS {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOS outside OSProvider");
  return v;
}

/** Let an app window contribute its menu-bar menus (read when a menu opens). */
export function useWindowMenus(winId: string, get: () => MenuSection[]) {
  const { registerMenus, unregisterMenus } = useOS();
  const ref = useRef(get);
  ref.current = get;
  useEffect(() => {
    registerMenus(winId, () => ref.current());
    return () => unregisterMenus(winId);
  }, [winId, registerMenus, unregisterMenus]);
}

function useMedia(q: string, initial: boolean) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    const m = matchMedia(q);
    const on = () => setV(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [q]);
  return v;
}

/** Move a visitor-made item (and anything inside it) to a new path. */
function relocate(c: FsChanges, from: string, to: string): FsChanges {
  return {
    ...c,
    created: c.created.map((x) => {
      if (x.path === from) return { ...x, path: to, name: basename(to), parent: dirname(to) };
      if (x.path.startsWith(from + "/")) {
        const p = to + x.path.slice(from.length);
        return { ...x, path: p, parent: dirname(p) };
      }
      return x;
    }),
  };
}

export function OSProvider({ children, resume = null }: { children: ReactNode; resume?: boolean | null }) {
  /* ---------- preferences & appearance ---------- */
  const [prefs, setPrefs] = useState<Prefs>(() => load(KEYS.prefs, DEFAULT_PREFS));
  useEffect(() => save(KEYS.prefs, prefs), [prefs]);
  const setPref = useCallback(<K extends keyof Prefs>(k: K, v: Prefs[K]) => setPrefs((p) => ({ ...p, [k]: v })), []);
  const resetPrefs = useCallback(() => setPrefs(DEFAULT_PREFS), []);

  const [host] = useState(hostTheme);
  const osDark = useMedia("(prefers-color-scheme: dark)", host === "dark");
  const systemDark = host ? host === "dark" : osDark;
  const appearance = prefs.appearance === "auto" ? (systemDark ? "dark" : "light") : prefs.appearance;
  const reduced = useMedia("(prefers-reduced-motion: reduce)", false);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const [viewport, setViewport] = useState(() => ({ w: innerWidth, h: innerHeight }));
  useEffect(() => {
    const on = () => setViewport({ w: innerWidth, h: innerHeight });
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);
  const mobile = viewport.w < MOBILE_BP;
  const [bootedAt] = useState(() => Date.now());

  /* ---------- file system ---------- */
  const [changes, setChanges] = useState<FsChanges>(() => load(KEYS.fs, NO_CHANGES));
  useEffect(() => save(KEYS.fs, changes), [changes]);
  const fs = useMemo(() => applyChanges(BASE_FS, changes), [changes]);
  const fsRef = useRef(fs);
  fsRef.current = fs;

  const [recents, setRecents] = useState<string[]>(() => load(KEYS.recents, [] as string[]));
  useEffect(() => save(KEYS.recents, recents), [recents]);
  const addRecent = useCallback((p: string) => setRecents((r) => [p, ...r.filter((x) => x !== p)].slice(0, 24)), []);

  /* ---------- window manager ---------- */
  const [wm, dispatch] = useReducer(wmReducer, initialWm);
  const wmRef = useRef(wm);
  wmRef.current = wm;

  const dockGap = mobile ? 76 : prefs.dockAutohide ? 6 : prefs.dockSize + 24;
  const area: Rect = useMemo(() => {
    const top = MENUBAR_H;
    const pos = mobile ? "bottom" : prefs.dockPosition;
    const x = pos === "left" ? dockGap : 0;
    const w = viewport.w - (pos === "bottom" ? 0 : dockGap);
    const h = viewport.h - top - (pos === "bottom" ? dockGap : 0);
    return { x, y: top, w, h };
  }, [viewport, mobile, prefs.dockPosition, dockGap]);
  const areaRef = useRef(area);
  areaRef.current = area;

  // Keep windows reachable when the viewport shrinks.
  useEffect(() => {
    dispatch({ type: "clamp", bounds: { w: viewport.w, h: viewport.h, top: MENUBAR_H } });
  }, [viewport]);

  const lastRects = useRef<Partial<Record<AppId, Rect>>>(load(KEYS.rects, {}));
  const rememberRect = useCallback((w: Win) => {
    if (w.mode !== "normal") return;
    lastRects.current = { ...lastRects.current, [w.app]: { x: w.x, y: w.y, w: w.w, h: w.h } };
    save(KEYS.rects, lastRects.current);
  }, []);

  const initialRect = useCallback((app: AppId): Rect => {
    const a = areaRef.current;
    const def = APPS[app];
    const w = Math.min(def.size[0], a.w - 40);
    const h = Math.min(def.size[1], a.h - 24);
    const open = wmRef.current.wins.filter((x) => x.phase !== "closing");
    const last = lastRects.current[app];
    const clash = (r: Rect) => open.some((o) => Math.abs(o.x - r.x) < 8 && Math.abs(o.y - r.y) < 8);
    let r: Rect;
    if (last && !clash(last)) r = { ...last };
    else {
      const n = open.length % 7;
      r = {
        x: Math.round(a.x + (a.w - w) / 2 + (n - 3) * 26),
        y: Math.round(a.y + Math.max(12, (a.h - h) / 2.6) + n * 22),
        w,
        h,
      };
    }
    return clampRect(r, { w: innerWidth, h: innerHeight, top: MENUBAR_H });
  }, []);

  const [bouncing, setBouncing] = useState<AppId[]>([]);
  const bounce = useCallback((app: AppId) => {
    if (reducedRef.current) return;
    setBouncing((b) => [...b.filter((x) => x !== app), app]);
    setTimeout(() => setBouncing((b) => b.filter((x) => x !== app)), 1300);
  }, []);

  const focus = useCallback((id: string) => dispatch({ type: "focus", id }), []);
  const focusDesktop = useCallback(() => dispatch({ type: "focusDesktop" }), []);
  const restore = useCallback((id: string) => dispatch({ type: "restore", id, instant: reducedRef.current }), []);
  const phaseDone = useCallback((id: string) => dispatch({ type: "phaseDone", id }), []);
  const setRect = useCallback((id: string, rect: Rect) => dispatch({ type: "rect", id, rect }), []);
  const setTitle = useCallback((id: string, title: string) => dispatch({ type: "title", id, title }), []);
  const setArgs = useCallback((id: string, args: AppArgs) => dispatch({ type: "args", id, args }), []);

  const minimize = useCallback((id: string) => {
    dispatch({ type: "minimize", id, instant: reducedRef.current });
  }, []);

  const close = useCallback(
    (id: string) => {
      const w = wmRef.current.wins.find((x) => x.id === id);
      if (w) rememberRect(w);
      dispatch({ type: "close", id, instant: reducedRef.current });
    },
    [rememberRect]
  );

  const launch = useCallback(
    (app: AppId, args: AppArgs = {}, opts: LaunchOpts = {}) => {
      const def = APPS[app];
      const mine = wmRef.current.wins.filter((w) => w.app === app && w.phase !== "closing");
      const hasArgs = Object.keys(args).length > 0;
      const reveal = (w: Win) => (w.minimized ? restore(w.id) : focus(w.id));

      if (app === "preview" && args.path) {
        const hit = mine.find((w) => w.args.path === args.path);
        if (hit) return reveal(hit);
      }
      if (def.single && mine.length) {
        if (hasArgs) setArgs(mine[0].id, { ...args, nonce: Date.now() });
        return reveal(mine[0]);
      }
      if (app === "safari" && hasArgs && mine.length && !opts.newWindow) {
        const front = [...mine].sort((a, b) => b.z - a.z)[0];
        setArgs(front.id, { ...args, nonce: Date.now() });
        return reveal(front);
      }
      if (mine.length && !opts.newWindow && !hasArgs) {
        const shown = mine.filter((w) => !w.minimized);
        if (!shown.length) return restore([...mine].sort((a, b) => b.z - a.z)[0].id);
        return dispatch({ type: "focusApp", app });
      }
      if (!mine.length) bounce(app);
      const rect = opts.rect ? clampRect(opts.rect, { w: innerWidth, h: innerHeight, top: MENUBAR_H }) : initialRect(app);
      dispatch({ type: "open", app, args, rect, instant: reducedRef.current });
    },
    [bounce, focus, initialRect, restore, setArgs]
  );

  const frameOf = useCallback(
    (w: Win): Rect => {
      if (mobile || w.mode === "zoomed") return area;
      if (w.mode === "fullscreen") return { x: 0, y: 0, w: viewport.w, h: viewport.h };
      return w;
    },
    [mobile, area, viewport]
  );

  const setMode = useCallback((id: string, mode: WinMode) => dispatch({ type: "mode", id, mode }), []);
  const toggleZoom = useCallback(
    (id: string) => {
      const w = wmRef.current.wins.find((x) => x.id === id);
      if (w) setMode(id, w.mode === "zoomed" ? "normal" : "zoomed");
      focus(id);
    },
    [focus, setMode]
  );
  const toggleFullscreen = useCallback(
    (id: string) => {
      const w = wmRef.current.wins.find((x) => x.id === id);
      if (w) setMode(id, w.mode === "fullscreen" ? "normal" : "fullscreen");
      focus(id);
    },
    [focus, setMode]
  );

  const quit = useCallback(
    (app: AppId) => {
      for (const w of wmRef.current.wins) if (w.app === app && w.phase !== "closing") close(w.id);
    },
    [close]
  );
  const hideApp = useCallback(
    (app: AppId) => {
      for (const w of wmRef.current.wins) if (w.app === app && !w.minimized) minimize(w.id);
    },
    [minimize]
  );
  const hideOthers = useCallback(
    (app: AppId) => {
      for (const w of wmRef.current.wins) if (w.app !== app && !w.minimized) minimize(w.id);
    },
    [minimize]
  );

  /* ---------- files: open, create, rename, trash ---------- */
  const openPath = useCallback(
    (path: string) => {
      const n: FsNode | undefined = fsRef.current[path];
      if (!n) return;
      if (n.kind === "folder" || n.kind === "volume") return launch("finder", { path }, { newWindow: true });
      addRecent(path);
      if (n.kind === "app" && n.app) return launch(n.app);
      if (n.kind === "link") {
        if (n.href?.startsWith("mailto:")) return launch("mail", { compose: true });
        const url = n.href ?? `ashos:unlinked?name=${encodeURIComponent(n.name.replace(/\.webloc$/, ""))}`;
        return launch("safari", { url });
      }
      if (n.app === "resume") return launch("resume");
      launch("preview", { path });
    },
    [addRecent, launch]
  );

  const canModify = useCallback((path: string) => !!fsRef.current[path]?.user, []);

  const createFolder = useCallback((dir: string) => {
    const parent = fsRef.current[dir];
    if (!parent || parent.kind === "app" || dir === "/Applications" || dir === TRASH) return null;
    const name = uniqueName(fsRef.current, dir, "untitled folder");
    const path = join(dir, name);
    const node: FsNode = { path, name, kind: "folder", parent: dir, children: [], glyph: "generic", info: "A folder you made.", user: true, created: Date.now() };
    setChanges((c) => ({ ...c, created: [...c.created, node] }));
    return path;
  }, []);

  const rename = useCallback((path: string, raw: string) => {
    const n = fsRef.current[path];
    const name = raw.replace(/\//g, "∕").trim();
    if (!n?.user || !n.parent || !name || name === n.name) return null;
    const next = join(n.parent, uniqueName(fsRef.current, n.parent, name));
    setChanges((c) => relocate(c, path, next));
    return next;
  }, []);

  const moveToTrash = useCallback((path: string) => {
    const n = fsRef.current[path];
    if (!n?.user || n.parent === TRASH) return;
    setChanges((c) => relocate(c, path, join(TRASH, uniqueName(fsRef.current, TRASH, n.name))));
  }, []);

  const emptyTrash = useCallback(() => {
    const inTrash = fsRef.current[TRASH]?.children ?? [];
    setChanges((c) => ({
      created: c.created.filter((x) => !x.path.startsWith(TRASH + "/")),
      removed: [...c.removed, ...inTrash.filter((p) => BASE_FS[p])],
    }));
  }, []);

  /* ---------- menus ---------- */
  const menuRegistry = useRef(new Map<string, () => MenuSection[]>());
  const registerMenus = useCallback((id: string, get: () => MenuSection[]) => {
    menuRegistry.current.set(id, get);
  }, []);
  const unregisterMenus = useCallback((id: string) => {
    menuRegistry.current.delete(id);
  }, []);
  const menusFor = useCallback((id: string | null) => (id ? menuRegistry.current.get(id)?.() ?? [] : []), []);

  /* ---------- shell UI ---------- */
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [ctx, setCtx] = useState<CtxMenu | null>(null);
  const openContextMenu = useCallback((x: number, y: number, items: MenuItem[]) => setCtx({ x, y, items }), []);
  const closeContextMenu = useCallback(() => setCtx(null), []);
  const [quickLook, setQuickLook] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const noteSeq = useRef(0);
  const dismiss = useCallback((id: number) => setNotes((n) => n.filter((x) => x.id !== id)), []);
  const dnd = prefs.doNotDisturb;
  const notify = useCallback(
    (n: Omit<Note, "id">) => {
      if (dnd) return;
      const id = ++noteSeq.current;
      setNotes((list) => [...list.slice(-2), { ...n, id }]);
      setTimeout(() => dismiss(id), 6500);
    },
    [dnd, dismiss]
  );

  const openSettings = useCallback((pane?: SettingsPane) => launch("settings", pane ? { pane } : {}), [launch]);

  const exitToPortfolio = useCallback(() => {
    // Inside the portfolio's takeover iframe: ask the parent to close it.
    // Opened directly: a full navigation, so ashOS styles never carry over.
    if (window.parent !== window) window.parent.postMessage("ashos:exit", location.origin);
    else location.href = "/";
  }, []);

  /* ---------- derived ---------- */
  const focused = wm.wins.find((w) => w.id === wm.focused && w.phase !== "closing") ?? null;
  const activeApp: AppId = focused?.app ?? "finder";
  const runningApps = useMemo(() => {
    const set: AppId[] = [];
    for (const w of wm.wins) if (w.phase !== "closing" && !set.includes(w.app)) set.push(w.app);
    return set;
  }, [wm.wins]);

  // If focus was lost (e.g. last window closed), fall back to the next one.
  useEffect(() => {
    if (wm.focused === null) return;
    if (!wm.wins.some((w) => w.id === wm.focused)) {
      const next = topWindow(wm.wins);
      if (next) dispatch({ type: "focus", id: next.id });
      else dispatch({ type: "focusDesktop" });
    }
  }, [wm]);

  const value: OS = {
    prefs,
    setPref,
    resetPrefs,
    appearance,
    viewport,
    mobile,
    reduced,
    area,
    bootedAt,
    resumeAvailable: resume,
    fs,
    recents,
    openPath,
    createFolder,
    rename,
    moveToTrash,
    emptyTrash,
    canModify,
    wins: wm.wins,
    focused,
    activeApp,
    launch,
    focus,
    focusDesktop,
    close,
    minimize,
    restore,
    toggleZoom,
    toggleFullscreen,
    setRect,
    setTitle,
    setArgs,
    phaseDone,
    quit,
    hideApp,
    hideOthers,
    frameOf,
    runningApps,
    bouncing,
    registerMenus,
    unregisterMenus,
    menusFor,
    overlay,
    setOverlay,
    ctx,
    openContextMenu,
    closeContextMenu,
    quickLook,
    setQuickLook,
    notes,
    notify,
    dismiss,
    openSettings,
    exitToPortfolio,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Platform-aware shortcut labels: ⌘/⌥ on Apple devices, Ctrl/Alt elsewhere. */
export function useKeyLabel() {
  const [mac] = useState(() => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  return useCallback(
    (s: string) => (mac ? s : s.replace(/⌘/g, "Ctrl+").replace(/⌥/g, "Alt+").replace(/⇧/g, "Shift+")),
    [mac]
  );
}
