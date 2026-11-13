"use client";

import { useEffect, useRef, useState, type MouseEvent as RMouseEvent } from "react";
import { APPS, DOCK_APPS, type AppId } from "../data/apps";
import { TRASH } from "../data/fs";
import { MENUBAR_H, useOS, type MenuItem } from "../state/os";
import { AppIcon, TrashIcon } from "./icons";
import { useLongPress } from "./longPress";

// The Dock's box model (os.css .ashos-dock): 6px padding each end, 4px gaps,
// and the separator (1px + 8px margin). Kept in step with the stylesheet.
const DOCK_PAD = 12;
const DOCK_GAP = 4;
const DOCK_SEP = 9;
const DOCK_EDGE = 6;
const DOCK_MIN = 16;

export function Dock() {
  const os = useOS();
  const ref = useRef<HTMLDivElement>(null);
  // Where the pointer is along the Dock while it hovers there (null: elsewhere).
  const pointerAt = useRef<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovered = useRef(false);
  // The menu the Dock last opened: while it's up, auto-hide leaves the Dock be.
  const [ownMenu, setOwnMenu] = useState<MenuItem[] | null>(null);
  const menuUp = !!os.ctx && os.ctx.items === ownMenu;
  const menuUpRef = useRef(menuUp);
  menuUpRef.current = menuUp;

  const pos = os.mobile ? "bottom" : os.prefs.dockPosition;
  const vertical = pos !== "bottom";
  const forcedHide = os.focused?.mode === "fullscreen";
  const autohide = !os.mobile && (os.prefs.dockAutohide || forcedHide);
  const magnify = os.prefs.dockMagnification && !os.mobile && !os.reduced;

  const extra = os.runningApps.filter((a) => !DOCK_APPS.includes(a));
  const minimized = os.wins.filter((w) => w.minimized && w.phase !== "closing");
  const trashFull = (os.fs[TRASH]?.children?.length ?? 0) > 0;

  // Like macOS, tiles shrink when the Dock would run past the screen edge
  // (every minimised window adds one). Phones scroll the Dock instead. On a
  // side, it also stays clear of the menu bar.
  const count = DOCK_APPS.length + extra.length + minimized.length + 1;
  const fixed = DOCK_PAD + DOCK_SEP + DOCK_GAP * count;
  const room = vertical ? os.viewport.h - 2 * (MENUBAR_H + DOCK_EDGE) : os.viewport.w - 2 * DOCK_EDGE;
  const base = os.mobile ? 46 : Math.min(os.prefs.dockSize, Math.max(DOCK_MIN, Math.floor((room - fixed) / count)));
  // What magnification may add before the Dock would leave the screen.
  const spare = Math.max(0, room - fixed - base * count);

  useEffect(() => () => void (hideTimer.current && clearTimeout(hideTimer.current)), []);

  const items = () => Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-dock-item]") ?? []);

  // Each tile's centre at rest (no magnification), from the box model rather
  // than measured, so scaling can't feed back and tiles added mid-hover count.
  const apps = DOCK_APPS.length + extra.length;
  const restCenter = (i: number) =>
    (vertical ? os.viewport.h : os.viewport.w) / 2 -
    (fixed + base * count) / 2 +
    DOCK_PAD / 2 +
    i * (base + DOCK_GAP) +
    (i >= apps ? DOCK_SEP + DOCK_GAP : 0) +
    base / 2;

  const magnifyAt = (p: number) => {
    const els = items();
    const range = base * 3.2;
    const max = os.prefs.dockMagnify;
    const ks = els.map((_, i) => {
      const d = Math.abs(p - restCenter(i));
      return d < range ? (Math.cos((Math.PI * d) / range) + 1) / 2 : 0;
    });
    // Scale the bulge down where the grown Dock wouldn't fit on screen.
    const grow = base * (max - 1) * ks.reduce((a, k) => a + k, 0);
    const fit = grow > spare ? spare / grow : 1;
    els.forEach((el, i) => el.style.setProperty("--s", String(1 + (max - 1) * ks[i] * fit)));
  };
  const onMove = (e: React.PointerEvent) => {
    if (!magnify || e.pointerType !== "mouse") return;
    pointerAt.current = vertical ? e.clientY : e.clientX;
    magnifyAt(pointerAt.current);
  };
  // A tile added or removed under the pointer (a window minimised, an app
  // quit) or a new tile size: magnify again from the new layout.
  useEffect(() => {
    if (magnify && hovered.current && pointerAt.current !== null) magnifyAt(pointerAt.current);
  });
  const hideSoon = () => {
    if (!autohide) return;
    hideTimer.current && clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => !menuUpRef.current && setRevealed(false), 450);
  };
  const reveal = () => {
    hideTimer.current && clearTimeout(hideTimer.current);
    setRevealed(true);
  };
  const onLeave = () => {
    hovered.current = false;
    pointerAt.current = null;
    items().forEach((el) => el.style.setProperty("--s", "1"));
    hideSoon();
  };
  const onEnter = () => {
    hovered.current = true;
    hideTimer.current && clearTimeout(hideTimer.current);
  };

  const appMenu = (app: AppId): MenuItem[] => {
    const wins = os.wins.filter((w) => w.app === app && w.phase !== "closing");
    const running = wins.length > 0;
    return [
      ...wins.map((w) => ({ label: w.title, checked: w.id === os.focused?.id, run: () => (w.minimized ? os.restore(w.id) : os.focus(w.id)) })),
      ...(wins.length ? ([{ sep: true }] as MenuItem[]) : []),
      ...(APPS[app].single && running ? [] : [{ label: "New Window", run: () => os.launch(app, {}, { newWindow: true }) }]),
      { label: running ? "Show All Windows" : "Open", run: () => os.launch(app) },
      ...(running
        ? ([
            { sep: true },
            { label: "Hide", run: () => os.hideApp(app) },
            ...(app === "finder" ? [] : [{ label: "Quit", run: () => os.quit(app) }]),
          ] as MenuItem[])
        : []),
    ];
  };

  const minMenu = (id: string): MenuItem[] => [
    { label: "Restore", run: () => os.restore(id) },
    { label: "Close", run: () => os.close(id) },
  ];
  const trashMenu = (): MenuItem[] => [
    { label: "Open", run: () => os.openPath(TRASH) },
    { sep: true },
    { label: "Empty Trash", disabled: !trashFull, run: os.emptyTrash },
  ];

  const openMenu = (x: number, y: number, menu: MenuItem[]) => {
    setOwnMenu(menu);
    os.openContextMenu(x, y, menu);
  };
  const ctx = (e: RMouseEvent, menu: MenuItem[]) => {
    e.preventDefault();
    openMenu(e.clientX, e.clientY, menu);
  };

  // Touch: long-press stands in for right-click (iOS never sends contextmenu).
  const longPress = useLongPress((x, y, t) => {
    const item = t.closest<HTMLElement>("[data-dock-item]");
    if (!item || !ref.current?.contains(item)) return;
    const { dockApp, dockMin } = item.dataset;
    if (dockApp && dockApp in APPS) openMenu(x, y, appMenu(dockApp as AppId));
    else if (dockMin && os.wins.some((w) => w.id === dockMin)) openMenu(x, y, minMenu(dockMin));
    else if (item.hasAttribute("data-dock-trash")) openMenu(x, y, trashMenu());
  });

  // Its menu closed: hide again unless the pointer is back on the Dock.
  const hadMenu = useRef(false);
  useEffect(() => {
    if (hadMenu.current && !menuUp && !hovered.current) hideSoon();
    hadMenu.current = menuUp;
  });

  const shown = !autohide || revealed;
  const cls =
    "ashos-dock" +
    ` ashos-dock--${pos}` +
    (shown ? "" : " is-hidden") +
    (magnify ? " is-magnify" : "");

  const appItem = (app: AppId) => {
    const running = os.runningApps.includes(app);
    return (
      <button
        key={app}
        type="button"
        data-dock-item=""
        data-dock-app={app}
        className={"ashos-dock__item" + (os.bouncing.includes(app) ? " is-bouncing" : "")}
        aria-label={`${APPS[app].name}${running ? " (running)" : ""}`}
        onClick={() => os.launch(app)}
        onContextMenu={(e) => ctx(e, appMenu(app))}
      >
        <span className="ashos-dock__tip">{APPS[app].name}</span>
        <AppIcon app={app} className="ashos-dock__icon" />
        {os.prefs.dockIndicators && <span className={"ashos-dock__dot" + (running ? " is-on" : "")} />}
      </button>
    );
  };

  return (
    <>
      {/* Leaving the edge without reaching the Dock hides it again. */}
      {autohide && <div className={`ashos-dock-hot ashos-dock-hot--${pos}`} onPointerEnter={reveal} onPointerLeave={hideSoon} aria-hidden="true" />}
      <div
        ref={ref}
        className={cls}
        style={{ ["--base" as string]: `${base}px` }}
        role="toolbar"
        aria-label="Dock"
        aria-orientation={vertical ? "vertical" : "horizontal"}
        onPointerDown={longPress}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerEnter={onEnter}
        onFocus={() => autohide && reveal()}
        onBlur={(e) => !hovered.current && !ref.current?.contains(e.relatedTarget as Node) && hideSoon()}
      >
        {DOCK_APPS.map(appItem)}
        {extra.map(appItem)}
        <span className="ashos-dock__sep" aria-hidden="true" />
        {minimized.map((w) => (
          <button
            key={w.id}
            type="button"
            data-dock-item=""
            data-dock-min={w.id}
            className="ashos-dock__item ashos-dock__item--min"
            aria-label={`Restore ${w.title}`}
            onClick={() => os.restore(w.id)}
            onContextMenu={(e) => ctx(e, minMenu(w.id))}
          >
            <span className="ashos-dock__tip">{w.title}</span>
            <span className="ashos-dock__mini">
              <AppIcon app={w.app} className="ashos-dock__icon" />
            </span>
          </button>
        ))}
        <button
          type="button"
          data-dock-item=""
          data-dock-trash=""
          className="ashos-dock__item"
          aria-label={trashFull ? "Trash (has items)" : "Trash (empty)"}
          onClick={() => os.openPath(TRASH)}
          onContextMenu={(e) => ctx(e, trashMenu())}
        >
          <span className="ashos-dock__tip">Trash</span>
          <span className="ashos-appicon ashos-dock__icon">
            <TrashIcon full={trashFull} />
          </span>
        </button>
      </div>
    </>
  );
}
