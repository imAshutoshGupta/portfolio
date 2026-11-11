"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { APPS, type AppId } from "../data/apps";
import { formatSize, kindLabel } from "../data/fs";
import { localNow, nowPlaying, person } from "../data/portfolio";
import { useOS } from "../state/os";
import { DocView } from "./DocView";
import { AppIcon, Cover, Glyph, NodeIcon } from "./icons";
import { useClock } from "./MenuBar";

/* ---------- Now playing (the portfolio's own /api/now-playing route) ---------- */

type Track = { live: false } | { live: true; isPlaying: boolean; title: string; artist: string; url?: string };

function useNowPlaying() {
  const [t, setT] = useState<Track | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/now-playing")
        .then((r) => (r.ok ? r.json() : { live: false }))
        .then((d) => alive && setT(d))
        .catch(() => alive && setT({ live: false }));
    load();
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return t;
}

function NowPlaying() {
  const t = useNowPlaying();
  const live = t?.live ? t : null;
  const label = live ? (live.isPlaying ? nowPlaying.label : nowPlaying.lastPlayedLabel) : nowPlaying.label;
  const text = live ? `${live.title} — ${live.artist}` : nowPlaying.fallback;
  const href = live?.url ?? nowPlaying.href;
  return (
    <div className="ashos-cc__module ashos-np">
      <span className={"ashos-np__art" + (live?.isPlaying ? " is-playing" : "")} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <div className="ashos-np__text">
        <span className="ashos-np__label">
          {label} · {person.firstName}
        </span>
        {href ? (
          <a href={href} target="_blank" rel="noopener" className="ashos-np__track">
            {text}
          </a>
        ) : (
          <span className="ashos-np__track">{text}</span>
        )}
      </div>
      <Glyph name="music" className="ashos-np__glyph" />
    </div>
  );
}

function LocalTime() {
  useClock(15_000);
  const t = localNow();
  return (
    <div className="ashos-cc__module ashos-lt">
      <span className="ashos-lt__label">{person.firstName}&apos;s time</span>
      <span className="ashos-lt__time">
        {t.time} <small>{t.zone}</small>
      </span>
      <span className="ashos-lt__mood">{t.mood}</span>
    </div>
  );
}

/* ---------- Control Centre ---------- */

function Toggle({ on, glyph, label, sub, onClick }: { on: boolean; glyph: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" className="ashos-cc__toggle" aria-pressed={on} onClick={onClick}>
      <span className={"ashos-cc__circle" + (on ? " is-on" : "")}>
        <Glyph name={glyph} />
      </span>
      <span className="ashos-cc__tlabel">
        <b>{label}</b>
        <small>{sub}</small>
      </span>
    </button>
  );
}

function usePanelDismiss(close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!ref.current?.contains(t) && !t.closest(".ashos-menubar__right")) close();
    };
    addEventListener("pointerdown", onDown, true);
    return () => removeEventListener("pointerdown", onDown, true);
  }, [close]);
  return ref;
}

export function ControlCentre() {
  const os = useOS();
  const close = () => os.setOverlay(null);
  const ref = usePanelDismiss(close);
  const dark = os.appearance === "dark";
  return (
    <div ref={ref} className="ashos-panel ashos-cc" role="dialog" aria-label="Control Centre">
      <div className="ashos-cc__grid">
        <div className="ashos-cc__module ashos-cc__stack">
          <Toggle on={os.prefs.wifi} glyph="wifi" label="Wi-Fi" sub={os.prefs.wifi ? "ashOS Network" : "Off"} onClick={() => os.setPref("wifi", !os.prefs.wifi)} />
          <Toggle on={dark} glyph="moon" label="Dark Mode" sub={dark ? "On" : "Off"} onClick={() => os.setPref("appearance", dark ? "light" : "dark")} />
          <Toggle on={os.prefs.doNotDisturb} glyph="bell" label="Do Not Disturb" sub={os.prefs.doNotDisturb ? "On" : "Off"} onClick={() => os.setPref("doNotDisturb", !os.prefs.doNotDisturb)} />
        </div>
        <div className="ashos-cc__col">
          <button type="button" className="ashos-cc__module ashos-cc__small" aria-pressed={os.prefs.desktopIcons} onClick={() => os.setPref("desktopIcons", !os.prefs.desktopIcons)}>
            <span className={"ashos-cc__circle" + (os.prefs.desktopIcons ? " is-on" : "")}>
              <Glyph name="desktop" />
            </span>
            <b>Desktop Icons</b>
          </button>
          <button type="button" className="ashos-cc__module ashos-cc__small" aria-pressed={os.prefs.dockAutohide} onClick={() => os.setPref("dockAutohide", !os.prefs.dockAutohide)}>
            <span className={"ashos-cc__circle" + (os.prefs.dockAutohide ? " is-on" : "")}>
              <Glyph name="dock" />
            </span>
            <b>Hide Dock</b>
          </button>
        </div>
      </div>
      <div className="ashos-cc__module ashos-cc__slider">
        <b>Display</b>
        <label className="ashos-range">
          <Glyph name="sun" />
          <input
            type="range"
            min={0.35}
            max={1}
            step={0.01}
            value={os.prefs.brightness}
            aria-label="Display brightness"
            onChange={(e) => os.setPref("brightness", Number(e.target.value))}
          />
        </label>
      </div>
      <NowPlaying />
      <LocalTime />
      <button type="button" className="ashos-cc__edit" onClick={() => (close(), os.openSettings())}>
        System Settings…
      </button>
    </div>
  );
}

/* ---------- Notification Centre (widgets) ---------- */

function Calendar() {
  const now = useClock(60_000);
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({ length: first + days }, (_, i) => (i < first ? null : i - first + 1));
  return (
    <div className="ashos-widget ashos-cal">
      <div className="ashos-cal__head">
        <b>{now.toLocaleString(undefined, { month: "long" })}</b>
        <span>{y}</span>
      </div>
      <div className="ashos-cal__grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="ashos-cal__dow">
            {d}
          </span>
        ))}
        {cells.map((d, i) => (
          <span key={i} className={d === now.getDate() ? "is-today" : undefined}>
            {d ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function NotificationCentre() {
  const os = useOS();
  const ref = usePanelDismiss(() => os.setOverlay(null));
  return (
    <div ref={ref} className="ashos-ncenter" role="dialog" aria-label="Notification Centre">
      <Calendar />
      <div className="ashos-widget">
        <LocalTime />
      </div>
      <div className="ashos-widget">
        <NowPlaying />
      </div>
      <div className="ashos-widget ashos-widget--status">
        <span className="ashos-status-dot" />
        <span>{person.statusLine}</span>
      </div>
    </div>
  );
}

/* ---------- Notification banners ---------- */

export function Toasts() {
  const os = useOS();
  return (
    <div className="ashos-toasts" aria-live="polite">
      {os.notes.map((n) => (
        <div
          key={n.id}
          role="status"
          className="ashos-toast"
          onClick={() => {
            n.run?.();
            os.dismiss(n.id);
          }}
        >
          <AppIcon app={n.app} className="ashos-toast__icon" />
          <div className="ashos-toast__text">
            <div className="ashos-toast__top">
              <b>{n.title}</b>
              <span>now</span>
            </div>
            <p>{n.body}</p>
          </div>
          <button
            type="button"
            className="ashos-toast__x"
            aria-label="Dismiss notification"
            onClick={(e) => {
              e.stopPropagation();
              os.dismiss(n.id);
            }}
          >
            <Glyph name="x" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- App switcher (⌥Tab) ---------- */

export function AppSwitcher({ apps, index }: { apps: AppId[]; index: number }) {
  return (
    <div className="ashos-switcher-layer">
      <div className="ashos-switcher" role="listbox" aria-label="Switch apps">
        {apps.map((a, i) => (
          <div key={a} role="option" aria-selected={i === index} className={"ashos-switcher__item" + (i === index ? " is-selected" : "")}>
            <AppIcon app={a} />
            {i === index && <span>{APPS[a].name}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Quick Look / Get Info ---------- */

export function QuickLook() {
  const os = useOS();
  const path = os.quickLook;
  const node = path ? os.fs[path] : null;
  useEffect(() => {
    if (!path) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.key === " " && !(e.target as HTMLElement).closest("input,textarea"))) {
        e.preventDefault();
        e.stopPropagation();
        os.setQuickLook(null);
      }
    };
    addEventListener("keydown", onKey, true);
    return () => removeEventListener("keydown", onKey, true);
  }, [path, os]);
  if (!node) return null;

  let body: ReactNode;
  if (node.doc && node.doc.length) body = <DocView doc={node.doc} />;
  else if (node.kind === "image" && node.image)
    body = (
      <div className="ashos-ql__image">
        <Cover seed={node.image.seed} title={node.image.title} caption={node.image.caption} src={node.image.src} />
        {!node.image.src && <p className="ashos-ql__note">{node.image.caption} · no image on the portfolio yet</p>}
      </div>
    );
  else body = null;

  const opener: AppId | null =
    node.kind === "app"
      ? node.app!
      : node.kind === "folder" || node.kind === "volume"
        ? "finder"
        : node.kind === "link"
          ? node.href?.startsWith("mailto:")
            ? "mail"
            : "safari"
          : node.app ?? "preview";

  return (
    <div className="ashos-ql-layer" onPointerDown={(e) => e.target === e.currentTarget && os.setQuickLook(null)}>
      <div className="ashos-ql" role="dialog" aria-label={`Quick Look: ${node.name}`}>
        <div className="ashos-ql__bar">
          <button type="button" className="ashos-ql__close" aria-label="Close Quick Look" onClick={() => os.setQuickLook(null)}>
            <Glyph name="x" />
          </button>
          <span className="ashos-ql__title">{node.name}</span>
          {opener && (
            <button
              type="button"
              className="ashos-btn"
              onClick={() => {
                os.setQuickLook(null);
                os.openPath(node.path);
              }}
            >
              Open with {APPS[opener].name}
            </button>
          )}
        </div>
        <div className="ashos-ql__body">
          {body ?? (
            <div className="ashos-ql__info">
              <NodeIcon node={node} className="ashos-ql__icon" />
              <h3>{node.name}</h3>
              <p>{node.info}</p>
            </div>
          )}
        </div>
        <dl className="ashos-ql__meta">
          <div>
            <dt>Kind</dt>
            <dd>{kindLabel(node)}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{node.children ? `${node.children.length} item${node.children.length === 1 ? "" : "s"}` : formatSize(node.size)}</dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>{node.parent === "/" ? "Macintosh HD" : node.parent?.slice(1).replace(/\//g, " › ") ?? "—"}</dd>
          </div>
          {node.modified && (
            <div>
              <dt>Date</dt>
              <dd>{node.modified}</dd>
            </div>
          )}
          {node.kind === "link" && (
            <div>
              <dt>URL</dt>
              <dd>{node.href ?? "Not linked yet"}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
