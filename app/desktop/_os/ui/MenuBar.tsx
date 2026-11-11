"use client";

import { useEffect, useRef, useState } from "react";
import { APPS } from "../data/apps";
import { contact } from "../data/portfolio";
import { useOS, type MenuItem, type MenuSection, type OS } from "../state/os";
import { AshMark, Glyph } from "./icons";
import { MenuList } from "./Menu";

/* ---------- live status ---------- */

export function useClock(every = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), every);
    return () => clearInterval(id);
  }, [every]);
  return now;
}

type BatteryLike = { level: number; charging: boolean; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void };

/** Real battery level where the browser exposes it; otherwise null. */
function useBattery() {
  const [b, setB] = useState<{ level: number; charging: boolean } | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryLike> };
    if (!nav.getBattery) return;
    let bat: BatteryLike | null = null;
    const on = () => bat && setB({ level: bat.level, charging: bat.charging });
    nav.getBattery().then((x) => {
      bat = x;
      on();
      x.addEventListener("levelchange", on);
      x.addEventListener("chargingchange", on);
    }, () => {});
    return () => {
      bat?.removeEventListener("levelchange", on);
      bat?.removeEventListener("chargingchange", on);
    };
  }, []);
  return b;
}

/* ---------- menus for the active app ---------- */

const copySelection = () => document.execCommand("copy");

function buildMenus(os: OS): { appName: string; sections: MenuSection[]; system: MenuItem[] } {
  const app = os.activeApp;
  const def = APPS[app];
  const win = os.focused;
  const custom = os.menusFor(win?.id ?? null);
  const pick = (title: string) => custom.find((m) => m.title === title)?.items;
  const appWins = os.wins.filter((w) => w.app === app && w.phase !== "closing");
  const finderGo: MenuItem[] = [
    { label: "Recents", run: () => os.launch("finder", { location: "recents" }, { newWindow: true }) },
    { label: "Documents", run: () => os.launch("finder", { path: "/Documents" }, { newWindow: true }) },
    { label: "Desktop", run: () => os.launch("finder", { path: "/Desktop" }, { newWindow: true }) },
    { label: "Downloads", run: () => os.launch("finder", { path: "/Downloads" }, { newWindow: true }) },
    { label: "Applications", run: () => os.launch("finder", { path: "/Applications" }, { newWindow: true }) },
    { label: "Projects", run: () => os.launch("finder", { path: "/Projects" }, { newWindow: true }) },
  ];

  const system: MenuItem[] = [
    { label: "About ashOS", run: () => os.openSettings("about") },
    { sep: true },
    { label: "System Settings…", run: () => os.openSettings() },
    {
      label: "Recent Items",
      submenu: os.recents.length
        ? os.recents.slice(0, 8).map((p) => ({ label: os.fs[p]?.name ?? p, run: () => os.openPath(p), disabled: !os.fs[p] }))
        : [{ label: "No recent items", disabled: true }],
    },
    { sep: true },
    { label: "Force Quit…", disabled: !os.runningApps.length, submenu: os.runningApps.map((a) => ({ label: APPS[a].name, run: () => os.quit(a) })) },
    { sep: true },
    { label: os.appearance === "dark" ? "Use Light Appearance" : "Use Dark Appearance", run: () => os.setPref("appearance", os.appearance === "dark" ? "light" : "dark") },
    { label: "Exit to Portfolio…", run: os.exitToPortfolio },
  ];

  const appMenu: MenuItem[] = [
    { label: `About ${def.name}`, run: () => os.notify({ app, title: def.name, body: def.description }) },
    { sep: true },
    { label: "Settings…", run: () => os.openSettings() },
    { sep: true },
    { label: `Hide ${def.name}`, shortcut: "⌥H", run: () => os.hideApp(app), disabled: !appWins.length },
    { label: "Hide Others", run: () => os.hideOthers(app) },
    { label: "Show All", run: () => os.wins.forEach((w) => w.minimized && os.restore(w.id)) },
    ...(app === "finder"
      ? []
      : ([{ sep: true }, { label: `Quit ${def.name}`, shortcut: "⌥Q", run: () => os.quit(app) }] as MenuItem[])),
  ];

  const file: MenuItem[] = pick("File") ?? [
    {
      label: app === "finder" ? "New Finder Window" : "New Window",
      shortcut: "⌥N",
      run: () => os.launch(app, {}, { newWindow: true }),
      disabled: !!def.single && appWins.length > 0,
    },
    { sep: true },
    { label: "Close Window", shortcut: "⌥W", disabled: !win, run: () => win && os.close(win.id) },
  ];

  const edit: MenuItem[] = pick("Edit") ?? [
    { label: "Copy", shortcut: "⌘C", run: copySelection },
    { label: "Select All", shortcut: "⌘A", run: () => document.execCommand("selectAll") },
  ];

  const view: MenuItem[] = [
    ...(pick("View") ?? []),
    ...(pick("View")?.length ? ([{ sep: true }] as MenuItem[]) : []),
    {
      label: win?.mode === "fullscreen" ? "Exit Full Screen" : "Enter Full Screen",
      disabled: !win || os.mobile,
      run: () => win && os.toggleFullscreen(win.id),
    },
  ];

  const go = pick("Go") ?? (app === "finder" ? finderGo : null);

  const windowMenu: MenuItem[] = [
    { label: "Minimise", shortcut: "⌥M", disabled: !win || win.mode === "fullscreen", run: () => win && os.minimize(win.id) },
    { label: "Zoom", disabled: !win || os.mobile, run: () => win && os.toggleZoom(win.id) },
    { sep: true },
    { label: "Bring All to Front", disabled: !appWins.length, run: () => appWins.forEach((w) => (w.minimized ? os.restore(w.id) : os.focus(w.id))) },
    ...(appWins.length ? ([{ sep: true }] as MenuItem[]) : []),
    ...appWins.map((w) => ({
      label: w.title,
      checked: w.id === win?.id,
      run: () => (w.minimized ? os.restore(w.id) : os.focus(w.id)),
    })),
  ];

  const help: MenuItem[] = [
    { label: "ashOS Help", run: () => os.openPath("/Desktop/Welcome.pdf") },
    { label: "Keyboard Shortcuts", run: () => os.openSettings("about") },
    { label: "Terminal Commands", run: () => os.launch("terminal", { command: "help" }, { newWindow: true }) },
    { sep: true },
    { label: "Open the Portfolio in Safari", run: () => os.launch("safari", { url: "/" }) },
    ...(contact.github ? [{ label: "GitHub ↗", run: () => window.open(contact.github!, "_blank", "noopener") }] : []),
  ];

  const sections: MenuSection[] = [
    { title: def.name, items: appMenu },
    { title: "File", items: file },
    { title: "Edit", items: edit },
    { title: "View", items: view },
    ...(go ? [{ title: "Go", items: go }] : []),
    ...custom.filter((m) => !["File", "Edit", "View", "Go"].includes(m.title)),
    { title: "Window", items: windowMenu },
    { title: "Help", items: help },
  ];
  return { appName: def.name, sections, system };
}

/* ---------- the bar ---------- */

export function MenuBar() {
  const os = useOS();
  const [open, setOpen] = useState<number | null>(null);
  const [kbd, setKbd] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const now = useClock(5000);
  const battery = useBattery();
  const { sections, system } = buildMenus(os);
  const all: MenuSection[] = [{ title: "ashOS", items: system }, ...sections];
  const shown = os.mobile ? all.slice(0, 2) : all;

  useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    addEventListener("pointerdown", onDown, true);
    return () => removeEventListener("pointerdown", onDown, true);
  }, [open]);

  const date = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(now);
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now);
  const fsActive = os.focused?.mode === "fullscreen";

  const toggleOverlay = (o: "control" | "notifications" | "spotlight") => {
    setOpen(null);
    os.setOverlay(os.overlay === o ? null : o);
  };

  return (
    <header ref={barRef} className={"ashos-menubar" + (fsActive ? " is-autohide" : "")} role="menubar" aria-label="Menu bar">
      <nav className="ashos-menubar__left">
        {shown.map((m, i) => (
          <div key={m.title + i} className="ashos-menubar__menu">
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={open === i}
              aria-label={i === 0 ? "ashOS menu" : undefined}
              className={"ashos-menubar__item" + (i === 0 ? " is-logo" : "") + (i === 1 ? " is-app" : "") + (open === i ? " is-open" : "")}
              onPointerDown={(e) => {
                if (e.pointerType === "mouse" && e.button === 0) {
                  setKbd(false);
                  setOpen(open === i ? null : i);
                  os.setOverlay(null);
                }
              }}
              onClick={(e) => {
                // Keyboard and touch activation (mouse uses pointerdown, like a real menu bar).
                if ((e.nativeEvent as PointerEvent).pointerType === "mouse") return;
                setKbd(e.detail === 0);
                setOpen(open === i ? null : i);
                os.setOverlay(null);
              }}
              onPointerEnter={() => open !== null && open !== i && setOpen(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setKbd(true);
                  setOpen(i);
                }
              }}
            >
              {i === 0 ? <AshMark className="ashos-menubar__mark" /> : m.title}
            </button>
            {open === i && (
              <MenuList
                items={m.items}
                label={m.title}
                className="ashos-menu--bar"
                autoFocus={kbd}
                onClose={() => setOpen(null)}
                onKeyNav={(d) => {
                  const n = (i + (d === "right" ? 1 : -1) + shown.length) % shown.length;
                  setOpen(n);
                  setKbd(true);
                  requestAnimationFrame(() =>
                    barRef.current?.querySelectorAll<HTMLButtonElement>(".ashos-menubar__item")[n]?.focus()
                  );
                }}
              />
            )}
          </div>
        ))}
      </nav>

      <div className="ashos-menubar__right">
        {os.prefs.doNotDisturb && !os.mobile && (
          <span className="ashos-menubar__status" title="Do Not Disturb is on">
            <Glyph name="moon" />
          </span>
        )}
        {!os.mobile && (
          <span className="ashos-menubar__status" title={battery ? `Battery ${Math.round(battery.level * 100)}%${battery.charging ? " (charging)" : ""}` : "Power adapter"}>
            <span className="ashos-battery" aria-hidden="true">
              <span style={{ width: `${Math.round((battery?.level ?? 1) * 100)}%` }} />
            </span>
            {battery && <span className="ashos-menubar__pct">{Math.round(battery.level * 100)}%</span>}
          </span>
        )}
        <button type="button" className="ashos-menubar__btn" aria-label={os.prefs.wifi ? "Wi-Fi: connected" : "Wi-Fi: off"} title="Wi-Fi" onClick={() => toggleOverlay("control")}>
          <Glyph name={os.prefs.wifi ? "wifi" : "wifiOff"} />
        </button>
        {!os.mobile && (
          <button type="button" className="ashos-menubar__btn" aria-label="Spotlight" title="Spotlight" onClick={() => toggleOverlay("spotlight")}>
            <Glyph name="search" />
          </button>
        )}
        <button
          type="button"
          className={"ashos-menubar__btn" + (os.overlay === "control" ? " is-open" : "")}
          aria-label="Control Centre"
          title="Control Centre"
          onClick={() => toggleOverlay("control")}
        >
          <Glyph name="controls" />
        </button>
        <button
          type="button"
          className={"ashos-menubar__clock" + (os.overlay === "notifications" ? " is-open" : "")}
          aria-label="Notification Centre"
          onClick={() => toggleOverlay("notifications")}
        >
          {!os.mobile && <span>{date}</span>}
          <span>{time}</span>
        </button>
      </div>
    </header>
  );
}

