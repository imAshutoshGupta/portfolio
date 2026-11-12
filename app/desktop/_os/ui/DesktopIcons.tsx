"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { kindLabel, type FsNode } from "../data/fs";
import { KEYS, load, save } from "../state/prefs";
import { useOS, type MenuItem, type OS } from "../state/os";
import { NodeIcon } from "./icons";

const DESKTOP = "/Desktop";
type Pos = Record<string, { x: number; y: number }>;

/** Context-menu items for a file or folder, shared by the desktop and Finder. */
export function itemMenu(os: OS, n: FsNode, extra: { rename?: () => void; open?: () => void } = {}): MenuItem[] {
  const user = os.canModify(n.path);
  return [
    { label: "Open", run: extra.open ?? (() => os.openPath(n.path)) },
    { label: "Quick Look", run: () => os.setQuickLook(n.path) },
    { sep: true },
    { label: "Get Info", run: () => os.setQuickLook(n.path) },
    ...(n.parent && n.parent !== DESKTOP && n.kind !== "volume"
      ? [{ label: "Show in Enclosing Folder", run: () => os.launch("finder", { path: n.parent! }, { newWindow: true }) }]
      : []),
    { sep: true },
    { label: "Rename", disabled: !user || !extra.rename, run: extra.rename },
    { label: "Move to Trash", disabled: !user || n.parent === "/Trash", run: () => os.moveToTrash(n.path) },
    ...(n.kind === "link" && n.href && !n.href.startsWith("mailto:") ? [{ label: "Copy Link", run: () => navigator.clipboard?.writeText(new URL(n.href!, location.href).href) }] : []),
  ];
}

export function DesktopIcons() {
  const os = useOS();
  const [pos, setPos] = useState<Pos>(() => load(KEYS.icons, {} as Pos));
  useEffect(() => save(KEYS.icons, pos), [pos]);
  const [sel, setSel] = useState<string[]>([]);
  const [band, setBand] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLElement>());
  const surface = useRef<HTMLDivElement>(null);

  const size = os.mobile ? 52 : os.prefs.desktopIconSize;
  const cellW = Math.max(92, size + 34);
  const cellH = size + 46;

  const items = useMemo(() => {
    const list = (os.fs[DESKTOP]?.children ?? []).map((p) => os.fs[p]).filter(Boolean);
    if (os.prefs.desktopSort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (os.prefs.desktopSort === "kind") list.sort((a, b) => kindLabel(a).localeCompare(kindLabel(b)) || a.name.localeCompare(b.name));
    return list;
  }, [os.fs, os.prefs.desktopSort]);

  // Default layout: columns from the top-right corner, like a fresh Mac.
  const area = os.area;
  const slot = useCallback(
    (i: number) => {
      const perCol = Math.max(1, Math.floor((area.h - 16) / cellH));
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      return { x: area.x + area.w - cellW * (col + 1) - 14, y: area.y + 14 + row * cellH };
    },
    [area, cellH, cellW]
  );
  const where = (n: FsNode, i: number) => {
    const p = pos[n.path];
    if (!p) return slot(i);
    return { x: Math.min(Math.max(p.x, 0), os.viewport.w - cellW), y: Math.min(Math.max(p.y, area.y), os.viewport.h - cellH) };
  };

  // Clean Up / sort resets manual positions.
  const cleanUp = useCallback(() => setPos({}), []);

  // Keyboard on the desktop (only while no window has focus).
  useEffect(() => {
    if (os.focused) return;
    const onKey = (e: KeyboardEvent) => {
      // Keys act on the selection, also from a clicked icon (Chrome and Firefox
      // focus it). Any other button, like an unselected icon reached with Tab,
      // handles its own Enter/Space (click).
      const t = e.target as HTMLElement;
      const own = t.closest("button");
      if (t.closest("input, textarea, [role=menu], [role=dialog]") || (own && !sel.some((p) => refs.current.get(p) === own)) || !sel.length || renaming) return;
      if (e.key === "Enter" || ((e.metaKey || e.ctrlKey) && e.key === "ArrowDown")) {
        e.preventDefault();
        sel.forEach((p) => os.openPath(p));
      } else if (e.key === " ") {
        e.preventDefault();
        os.setQuickLook(sel[0]);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Backspace") {
        sel.forEach((p) => os.moveToTrash(p));
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [os, sel, renaming]);

  /* ---- rubber-band selection on the empty desktop ---- */
  const onSurfaceDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.button !== 0) return;
    os.focusDesktop();
    os.setOverlay(null);
    setSel([]);
    setRenaming(null);
    const sx = e.clientX;
    const sy = e.clientY;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const r = { x: Math.min(sx, ev.clientX), y: Math.min(sy, ev.clientY), w: Math.abs(ev.clientX - sx), h: Math.abs(ev.clientY - sy) };
      if (r.w + r.h < 4) return;
      setBand(r);
      const hit: string[] = [];
      refs.current.forEach((node, path) => {
        const b = node.getBoundingClientRect();
        if (b.left < r.x + r.w && b.right > r.x && b.top < r.y + r.h && b.bottom > r.y) hit.push(path);
      });
      setSel(hit);
    };
    const up = () => {
      setBand(null);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  /* ---- dragging icons ---- */
  const onIconDown = (e: RPointerEvent<HTMLButtonElement>, n: FsNode) => {
    if (e.button !== 0 || renaming === n.path) return;
    os.focusDesktop();
    os.setOverlay(null);
    const multi = e.metaKey || e.ctrlKey || e.shiftKey;
    const group = multi ? (sel.includes(n.path) ? sel.filter((p) => p !== n.path) : [...sel, n.path]) : sel.includes(n.path) ? sel : [n.path];
    setSel(group);
    if (e.pointerType !== "mouse" || multi) return;
    const sx = e.clientX;
    const sy = e.clientY;
    const start = new Map(group.map((p) => [p, where(os.fs[p], items.findIndex((x) => x.path === p))]));
    let moved = false;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      moved = true;
      start.forEach((_, p) => {
        const node = refs.current.get(p);
        if (node) node.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    };
    const up = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      if (!moved) return;
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      const next: Pos = {};
      start.forEach((p0, p) => {
        const node = refs.current.get(p);
        if (node) node.style.transform = "";
        next[p] = { x: Math.round(p0.x + dx), y: Math.round(p0.y + dy) };
      });
      // Pin the other icons where they are so they don't reflow.
      setPos((old) => {
        const all: Pos = {};
        items.forEach((it, j) => (all[it.path] = old[it.path] ?? slot(j)));
        return { ...all, ...next };
      });
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const newFolder = () => {
    const p = os.createFolder(DESKTOP);
    if (p) {
      setSel([p]);
      setTimeout(() => setRenaming(p), 30);
    }
  };

  const desktopMenu = (): MenuItem[] => [
    { label: "New Folder", run: newFolder },
    { sep: true },
    { label: "Get Info", run: () => os.setQuickLook(DESKTOP) },
    { label: "Change Wallpaper…", run: () => os.openSettings("wallpaper") },
    { label: os.appearance === "dark" ? "Use Light Appearance" : "Use Dark Appearance", run: () => os.setPref("appearance", os.appearance === "dark" ? "light" : "dark") },
    { sep: true },
    { label: "Clean Up", run: cleanUp },
    {
      label: "Sort By",
      submenu: (["none", "name", "kind"] as const).map((k) => ({
        label: k === "none" ? "None" : k === "name" ? "Name" : "Kind",
        checked: os.prefs.desktopSort === k,
        run: () => {
          os.setPref("desktopSort", k);
          cleanUp();
        },
      })),
    },
    { label: "Show View Options", run: () => os.openSettings("desktop") },
    { sep: true },
    { label: "New Terminal at Folder", run: () => os.launch("terminal", { cwd: DESKTOP }, { newWindow: true }) },
  ];

  return (
    <div
      ref={surface}
      className="ashos-desktop"
      onPointerDown={onSurfaceDown}
      onContextMenu={(e) => {
        e.preventDefault();
        if (e.target === e.currentTarget) {
          os.focusDesktop();
          setSel([]);
          os.openContextMenu(e.clientX, e.clientY, desktopMenu());
        }
      }}
      aria-label="Desktop"
    >
      {os.prefs.desktopIcons &&
        items.map((n, i) => {
          const p = where(n, i);
          const selected = sel.includes(n.path);
          return (
            <button
              key={n.path}
              type="button"
              ref={(el) => {
                if (el) refs.current.set(n.path, el);
                else refs.current.delete(n.path);
              }}
              className={"ashos-dicon" + (selected ? " is-selected" : "")}
              style={{ left: p.x, top: p.y, width: cellW, ["--icon" as string]: `${size}px` }}
              aria-label={`${n.name}, ${kindLabel(n)}`}
              aria-pressed={selected}
              onPointerDown={(e) => onIconDown(e, n)}
              onDoubleClick={() => renaming !== n.path && os.openPath(n.path)}
              onClick={(e) => {
                // Touch: a single tap opens. Keyboard: Enter/Space activates.
                const pe = e.nativeEvent as PointerEvent;
                if (pe.pointerType === "touch" || e.detail === 0) os.openPath(n.path);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                os.focusDesktop();
                if (!selected) setSel([n.path]);
                os.openContextMenu(e.clientX, e.clientY, itemMenu(os, n, { rename: () => setRenaming(n.path) }));
              }}
            >
              <NodeIcon node={n} className="ashos-dicon__img" />
              {renaming === n.path ? (
                <input
                  className="ashos-rename"
                  defaultValue={n.name}
                  autoFocus
                  aria-label="New name"
                  onFocus={(e) => e.currentTarget.select()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                      const next = os.rename(n.path, e.currentTarget.value);
                      if (next) {
                        setSel([next]);
                        // Keep the icon where it was.
                        setPos((old) => (old[n.path] ? { ...old, [next]: old[n.path] } : old));
                      }
                      setRenaming(null);
                    } else if (e.key === "Escape") setRenaming(null);
                  }}
                  onBlur={(e) => {
                    os.rename(n.path, e.currentTarget.value);
                    setRenaming(null);
                  }}
                />
              ) : (
                <span className="ashos-dicon__label">{n.name}</span>
              )}
            </button>
          );
        })}
      {band && <div className="ashos-band" style={{ left: band.x, top: band.y, width: band.w, height: band.h }} />}
    </div>
  );
}
