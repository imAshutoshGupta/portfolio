"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { APPS, type AppId } from "./data/apps";
import { wallpaperById } from "./data/wallpapers";
import { About } from "./apps/About";
import { Finder } from "./apps/Finder";
import { Mail } from "./apps/Mail";
import { Projects } from "./apps/Projects";
import { Safari } from "./apps/Safari";
import { Settings } from "./apps/Settings";
import { Terminal } from "./apps/Terminal";
import { Photos, Preview, Resume } from "./apps/Viewers";
import { OSProvider, useKeyLabel, useOS } from "./state/os";
import { ACCENTS, KEYS } from "./state/prefs";
import type { Win } from "./state/wm";
import { DesktopIcons } from "./ui/DesktopIcons";
import { Dock } from "./ui/Dock";
import { ContextMenu } from "./ui/Menu";
import { MenuBar } from "./ui/MenuBar";
import { AppSwitcher, ControlCentre, NotificationCentre, QuickLook, Toasts } from "./ui/Panels";
import { Spotlight } from "./ui/Spotlight";
import { returnFocus, useWindowFocusMemory, Window } from "./ui/Window";

const VIEWS: Record<AppId, () => ReactNode> = {
  finder: Finder,
  about: About,
  projects: Projects,
  terminal: Terminal,
  safari: Safari,
  mail: Mail,
  resume: Resume,
  photos: Photos,
  preview: Preview,
  settings: Settings,
};

function AppView({ win }: { win: Win }) {
  const View = VIEWS[win.app];
  return <View />;
}

/** Is the key press going into something that takes text? */
function isTyping(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable || t instanceof HTMLTextAreaElement) return true;
  return t instanceof HTMLInputElement && !["checkbox", "radio", "range", "button", "submit", "reset", "color", "file"].includes(t.type);
}

/** Did ⌥ turn this key into a different character (or a dead key)? */
function typesWithAlt(e: KeyboardEvent): boolean {
  if (e.key === "Dead") return true;
  if (e.key.length !== 1 || /^[a-z,]$/i.test(e.key)) return false;
  return /^Key[A-Z]$/.test(e.code) || e.code === "Comma";
}

// What each physical key types on the visitor's layout, where the browser
// says (Chromium). Read once and again when the window regains focus.
type LayoutMap = { get: (code: string) => string | undefined };
let layout: LayoutMap | null = null;
function readLayout() {
  const kb = (navigator as Navigator & { keyboard?: { getLayoutMap?: () => Promise<LayoutMap> } }).keyboard;
  kb?.getLayoutMap?.().then(
    (m) => void (layout = m),
    () => {}
  );
}

/**
 * The shortcut key as the visitor's layout labels it, in e.code form
 * ("KeyQ", "Comma"), so ⌥A on AZERTY (the physical Q key) isn't ⌥Q. A plain
 * letter in e.key is the answer; on a Mac ⌥ turns e.key into "œ" and the
 * like, so then ask the layout map, and failing that the physical key.
 */
function shortcutCode(e: KeyboardEvent): string {
  const named = (k: string | undefined) => (k && /^[a-z]$/i.test(k) ? "Key" + k.toUpperCase() : k === "," ? "Comma" : null);
  return named(e.key) ?? named(layout?.get(e.code)) ?? e.code;
}

/** Global shortcuts. Browser-reserved ⌘ combos also work with ⌥. */
function useShortcuts(setSwitcher: (s: { apps: AppId[]; i: number } | null) => void, switcher: { apps: AppId[]; i: number } | null) {
  const os = useOS();
  const ref = useRef({ os, switcher });
  ref.current = { os, switcher };

  useEffect(() => {
    const appsByRecency = () => {
      const { os } = ref.current;
      const seen: AppId[] = [];
      for (const w of [...os.wins].filter((w) => w.phase !== "closing").sort((a, b) => b.z - a.z)) if (!seen.includes(w.app)) seen.push(w.app);
      if (!seen.includes("finder")) seen.push("finder");
      return seen;
    };

    const onKey = (e: KeyboardEvent) => {
      const { os, switcher } = ref.current;
      // AltGr (Windows layouts) reports Ctrl+Alt but types a character, e.g.
      // AltGr+Q is "@" on a German keyboard: that's typing, not ⌥Q. Firefox
      // on a Mac reports AltGraph for plain ⌥ too, without Ctrl: not AltGr.
      if (e.ctrlKey && e.getModifierState?.("AltGraph")) return;
      const mod = e.metaKey || e.ctrlKey;
      const alt = e.altKey;
      // On a Mac ⌥ types characters (⌥Q = œ, ⌥N starts ñ). In a text field,
      // let that typing through; where ⌥ just gives the plain letter (Windows,
      // Linux) the shortcut still works, so ⌥W/⌥Q keep working in Terminal.
      if (alt && !mod && isTyping(e.target) && typesWithAlt(e)) return;
      const code = shortcutCode(e);
      const win = os.focused;

      if ((mod && code === "Space") || (mod && !alt && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        os.setOverlay(os.overlay === "spotlight" ? null : "spotlight");
        return;
      }
      if ((mod || alt) && e.key === "Tab") {
        e.preventDefault();
        const apps = switcher?.apps ?? appsByRecency();
        if (apps.length < 1) return;
        const cur = switcher?.i ?? 0;
        const i = (cur + (e.shiftKey ? -1 : 1) + apps.length) % apps.length;
        setSwitcher({ apps, i });
        return;
      }
      if (switcher && e.key === "Escape") {
        e.preventDefault();
        setSwitcher(null);
        return;
      }
      if ((mod || alt) && code === "KeyW" && win) {
        e.preventDefault();
        os.close(win.id);
        return;
      }
      if ((mod || alt) && code === "KeyQ" && os.activeApp !== "finder") {
        e.preventDefault();
        os.quit(os.activeApp);
        return;
      }
      if (alt && !mod && code === "KeyM" && win) {
        e.preventDefault();
        // Like the button and menu item: full screen windows don't minimise.
        if (win.mode !== "fullscreen") os.minimize(win.id);
        return;
      }
      if (alt && !mod && code === "KeyH") {
        e.preventDefault();
        os.hideApp(os.activeApp);
        return;
      }
      if (alt && !mod && code === "KeyN") {
        e.preventDefault();
        const app = os.activeApp;
        if (!(APPS[app].single && os.runningApps.includes(app))) os.launch(app, {}, { newWindow: true });
        return;
      }
      if (alt && !mod && code === "Comma") {
        e.preventDefault();
        os.openSettings();
        return;
      }
      if (e.key === "Escape") {
        if (os.ctx) os.closeContextMenu();
        else if (os.quickLook) os.setQuickLook(null);
        else if (os.overlay) os.setOverlay(null);
        else if (win?.mode === "fullscreen") os.toggleFullscreen(win.id);
      }
    };

    // Releasing the modifier commits the app switcher.
    const onUp = (e: KeyboardEvent) => {
      const { os, switcher } = ref.current;
      if (!switcher) return;
      if (["Meta", "Control", "Alt"].includes(e.key)) {
        const app = switcher.apps[switcher.i];
        setSwitcher(null);
        if (app) os.launch(app);
      }
    };
    const onBlur = () => ref.current.switcher && setSwitcher(null);

    readLayout();
    addEventListener("keydown", onKey);
    addEventListener("keyup", onUp);
    addEventListener("blur", onBlur);
    addEventListener("focus", readLayout);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("keyup", onUp);
      removeEventListener("blur", onBlur);
      removeEventListener("focus", readLayout);
    };
  }, [setSwitcher]);
}

function Shell() {
  const os = useOS();
  const key = useKeyLabel();
  const [switcher, setSwitcher] = useState<{ apps: AppId[]; i: number } | null>(null);
  useShortcuts(setSwitcher, switcher);

  // Closing Spotlight, a panel, a context menu or Quick Look without picking
  // anything hands focus back to the active window.
  useWindowFocusMemory();
  const layers = useRef({ overlay: os.overlay, ctx: os.ctx, quickLook: os.quickLook });
  useEffect(() => {
    const was = layers.current;
    layers.current = { overlay: os.overlay, ctx: os.ctx, quickLook: os.quickLook };
    if ((was.overlay && was.overlay !== os.overlay) || (was.ctx && was.ctx !== os.ctx) || (was.quickLook && was.quickLook !== os.quickLook)) returnFocus();
  }, [os.overlay, os.ctx, os.quickLook]);

  // Boot: a couple of windows and, once per session, a hint.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const first = !sessionStorage.getItem(KEYS.booted);
    sessionStorage.setItem(KEYS.booted, "1");
    const a = os.area;
    if (os.mobile) {
      os.launch("about");
    } else {
      // Finder behind on the left (sidebar visible), About Me in front on the
      // right, both clear of the desktop icon column.
      const icons = Math.max(92, os.prefs.desktopIconSize + 34) + 24;
      const fw = Math.min(800, a.w * 0.55);
      const fh = Math.min(520, a.h * 0.64);
      const aw = Math.min(700, a.w * 0.48);
      const ah = Math.min(560, a.h - 70);
      os.launch("finder", { path: "/Projects" }, { rect: { x: a.x + Math.max(24, a.w * 0.03), y: a.y + 36, w: fw, h: fh } });
      os.launch("about", {}, { rect: { x: a.x + a.w - icons - aw, y: a.y + Math.min(120, a.h - ah - 10), w: aw, h: ah } });
    }
    if (first) {
      const t = setTimeout(
        () =>
          os.notify({
            app: "finder",
            title: "Welcome to ashOS",
            body: os.mobile ? "Tap the dock to open apps. Open Finder to browse the portfolio." : key("Press ⌘K or Ctrl+Space to search. Click here for a quick guide."),
            run: () => os.openPath("/Desktop/Welcome.pdf"),
          }),
        900
      );
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wp = wallpaperById(os.prefs.wallpaper);
  const accent = ACCENTS.find((a) => a.id === os.prefs.accent) ?? ACCENTS[0];
  const dark = os.appearance === "dark";
  const style = {
    "--accent": dark ? accent.dark : accent.light,
    "--dock-base": `${os.prefs.dockSize}px`,
  } as CSSProperties;

  return (
    <div
      className="ashos"
      data-appearance={os.appearance}
      data-mobile={os.mobile ? "" : undefined}
      data-solid={os.prefs.reduceTransparency ? "" : undefined}
      data-reduced={os.reduced ? "" : undefined}
      style={style}
      onContextMenu={(e) => {
        // Keep the browser menu for text fields and real links only.
        const t = e.target as HTMLElement;
        if (!t.closest("input, textarea, a[href], iframe")) e.preventDefault();
      }}
    >
      <div className="ashos-wallpaper" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wp.light} alt="" className={dark ? "" : "is-on"} draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wp.dark} alt="" className={dark ? "is-on" : ""} draggable={false} />
      </div>

      <DesktopIcons />

      <main className="ashos-windows" aria-label="Windows">
        {os.wins.map((w) => (
          <Window key={w.id} win={w}>
            <AppView win={w} />
          </Window>
        ))}
      </main>

      <Dock />
      <MenuBar />

      {os.overlay === "control" && <ControlCentre />}
      {os.overlay === "notifications" && <NotificationCentre />}
      {os.overlay === "spotlight" && <Spotlight />}
      {switcher && <AppSwitcher apps={switcher.apps} index={switcher.i} />}
      <QuickLook />
      <ContextMenu />
      <Toasts />

      <div className="ashos-dim" style={{ opacity: 1 - os.prefs.brightness }} aria-hidden="true" />
    </div>
  );
}

export function Desktop({ resume }: { resume: boolean | null }) {
  return (
    <OSProvider resume={resume}>
      <Shell />
    </OSProvider>
  );
}
