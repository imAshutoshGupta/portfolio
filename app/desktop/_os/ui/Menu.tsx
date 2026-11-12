"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useKeyLabel, useOS, type MenuItem } from "../state/os";
import { Glyph } from "./icons";

type Props = {
  items: MenuItem[];
  /** "escape" when the visitor backed out with Esc (nothing was chosen). */
  onClose: (how?: "escape") => void;
  style?: CSSProperties;
  className?: string;
  /** Focus the first item on mount (keyboard-opened menus). */
  autoFocus?: boolean;
  onKeyNav?: (dir: "left" | "right") => void;
  label?: string;
};

/** A dropdown menu with keyboard navigation and one level of submenus. */
export function MenuList({ items, onClose, style, className, autoFocus, onKeyNav, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState<number | null>(null);
  const key = useKeyLabel();

  useEffect(() => {
    if (autoFocus) ref.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [autoFocus]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const btns = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>(":scope > .ashos-menu__row > button:not(:disabled)") ?? []);
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      btns[(i + 1) % btns.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      btns[(i - 1 + btns.length) % btns.length]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose("escape");
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const idx = Number((document.activeElement as HTMLElement)?.dataset.idx);
      const it = items[idx];
      if (e.key === "ArrowRight" && it && !it.sep && it.submenu) {
        e.preventDefault();
        e.stopPropagation();
        setSub(idx);
        return;
      }
      if (onKeyNav) {
        e.preventDefault();
        e.stopPropagation();
        onKeyNav(e.key === "ArrowRight" ? "right" : "left");
      }
    }
  };

  // In a submenu: ← goes back to its row, → moves on to the next menu-bar
  // menu (context menus have none, so → stays put).
  const subNav = (i: number) => (d: "left" | "right") => {
    if (d === "right") return onKeyNav?.("right");
    ref.current?.querySelector<HTMLButtonElement>(`:scope > .ashos-menu__row > button[data-idx="${i}"]`)?.focus();
    setSub(null);
  };

  return (
    <div ref={ref} role="menu" aria-label={label} className={"ashos-menu " + (className ?? "")} style={style} onKeyDown={onKeyDown}>
      {items.map((it, i) =>
        it.sep ? (
          <div key={i} className="ashos-menu__sep" role="separator" />
        ) : (
          <div key={i} className="ashos-menu__row" onPointerEnter={() => setSub(it.submenu ? i : null)}>
            <button
              type="button"
              role={it.checked !== undefined ? "menuitemcheckbox" : "menuitem"}
              aria-checked={it.checked}
              aria-haspopup={it.submenu ? "menu" : undefined}
              data-idx={i}
              disabled={it.disabled}
              className={"ashos-menu__item" + (sub === i ? " is-open" : "")}
              onClick={() => {
                if (it.submenu) return setSub(i);
                onClose();
                it.run?.();
              }}
            >
              <span className="ashos-menu__check">{it.checked && <Glyph name="check" />}</span>
              <span className="ashos-menu__label">{it.label}</span>
              {it.shortcut && <span className="ashos-menu__key">{key(it.shortcut)}</span>}
              {it.submenu && <Glyph name="chevronRight" className="ashos-menu__more" />}
            </button>
            {it.submenu && sub === i && (
              <MenuList
                items={it.submenu}
                onClose={onClose}
                className="ashos-menu--sub"
                autoFocus
                onKeyNav={subNav(i)}
              />
            )}
          </div>
        )
      )}
    </div>
  );
}

/** The right-click menu, positioned at the pointer and kept on screen. */
export function ContextMenu() {
  const os = useOS();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ctx = os.ctx;

  useLayoutEffect(() => {
    if (!ctx) return setPos(null);
    const el = ref.current?.firstElementChild as HTMLElement | null;
    const w = el?.offsetWidth ?? 220;
    const h = el?.offsetHeight ?? 200;
    setPos({
      x: Math.min(ctx.x, innerWidth - w - 6),
      y: ctx.y + h > innerHeight - 6 ? Math.max(6, ctx.y - h) : ctx.y,
    });
  }, [ctx]);

  if (!ctx) return null;
  return (
    <div
      className="ashos-ctx-layer"
      onPointerDown={(e) => e.target === e.currentTarget && os.closeContextMenu()}
      onContextMenu={(e) => {
        e.preventDefault();
        os.closeContextMenu();
      }}
    >
      <div ref={ref} style={{ position: "absolute", left: pos?.x ?? ctx.x, top: pos?.y ?? ctx.y, visibility: pos ? "visible" : "hidden" }}>
        {/* Focus waits until it's placed: a hidden menu can't take focus. */}
        <MenuList items={ctx.items} onClose={os.closeContextMenu} autoFocus={!!pos} label="Context menu" />
      </div>
    </div>
  );
}
