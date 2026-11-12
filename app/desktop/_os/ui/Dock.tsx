"use client";

import { useEffect, useRef, useState, type MouseEvent as RMouseEvent } from "react";
import { APPS, DOCK_APPS, type AppId } from "../data/apps";
import { TRASH } from "../data/fs";
import { useOS, type MenuItem } from "../state/os";
import { AppIcon, TrashIcon } from "./icons";

export function Dock() {
  const os = useOS();
  const ref = useRef<HTMLDivElement>(null);
  const centers = useRef<number[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovered = useRef(false);

  const pos = os.mobile ? "bottom" : os.prefs.dockPosition;
  const vertical = pos !== "bottom";
  const forcedHide = os.focused?.mode === "fullscreen";
  const autohide = !os.mobile && (os.prefs.dockAutohide || forcedHide);
  const magnify = os.prefs.dockMagnification && !os.mobile && !os.reduced;
  const base = os.mobile ? 46 : os.prefs.dockSize;

  const extra = os.runningApps.filter((a) => !DOCK_APPS.includes(a));
  const minimized = os.wins.filter((w) => w.minimized && w.phase !== "closing");
  const trashFull = (os.fs[TRASH]?.children?.length ?? 0) > 0;

  useEffect(() => () => void (hideTimer.current && clearTimeout(hideTimer.current)), []);

  const items = () => Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-dock-item]") ?? []);

  const onMove = (e: React.PointerEvent) => {
    if (!magnify || e.pointerType !== "mouse") return;
    const els = items();
    if (!centers.current) {
      // Rest positions, measured once per hover so scaling can't feed back.
      centers.current = els.map((el) => {
        const r = el.getBoundingClientRect();
        return vertical ? r.top + r.height / 2 : r.left + r.width / 2;
      });
    }
    const p = vertical ? e.clientY : e.clientX;
    const range = base * 3.2;
    const max = os.prefs.dockMagnify;
    els.forEach((el, i) => {
      const d = Math.abs(p - (centers.current![i] ?? 0));
      const k = d < range ? (Math.cos((Math.PI * d) / range) + 1) / 2 : 0;
      el.style.setProperty("--s", String(1 + (max - 1) * k));
    });
  };
  const hideSoon = () => {
    if (!autohide) return;
    hideTimer.current && clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setRevealed(false), 450);
  };
  const reveal = () => {
    hideTimer.current && clearTimeout(hideTimer.current);
    setRevealed(true);
  };
  const onLeave = () => {
    hovered.current = false;
    centers.current = null;
    items().forEach((el) => el.style.setProperty("--s", "1"));
    hideSoon();
  };
  const onEnter = () => {
    hovered.current = true;
    hideTimer.current && clearTimeout(hideTimer.current);
    centers.current = null;
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

  const ctx = (e: RMouseEvent, menu: MenuItem[]) => {
    e.preventDefault();
    os.openContextMenu(e.clientX, e.clientY, menu);
  };

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
            onContextMenu={(e) => ctx(e, [{ label: "Restore", run: () => os.restore(w.id) }, { label: "Close", run: () => os.close(w.id) }])}
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
          onContextMenu={(e) =>
            ctx(e, [
              { label: "Open", run: () => os.openPath(TRASH) },
              { sep: true },
              { label: "Empty Trash", disabled: !trashFull, run: os.emptyTrash },
            ])
          }
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
