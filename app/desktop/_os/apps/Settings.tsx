"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { SettingsPane } from "../data/apps";
import { SHORTCUTS } from "../data/shortcuts";
import { person } from "../data/portfolio";
import { WALLPAPERS, wallpaperById } from "../data/wallpapers";
import { useKeyLabel, useOS, useWindowMenus } from "../state/os";
import { ACCENTS, type Prefs } from "../state/prefs";
import { AshMark, Glyph } from "../ui/icons";
import { DragRegion, useWin } from "../ui/Window";

const PANES: { id: SettingsPane; label: string; glyph: string; tint: string }[] = [
  { id: "appearance", label: "Appearance", glyph: "paint", tint: "#1c1c1e" },
  { id: "wallpaper", label: "Wallpaper", glyph: "photo", tint: "#30b0f0" },
  { id: "desktop", label: "Desktop & Dock", glyph: "dock", tint: "#2c2c2e" },
  { id: "about", label: "About ashOS", glyph: "info", tint: "#8e8e93" },
];

/* ---------- controls ---------- */

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="ashos-switch" onClick={() => onChange(!on)} />;
}

function Row({ label, sub, children }: { label: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="ashos-row">
      <div className="ashos-row__label">
        <span>{label}</span>
        {sub && <small>{sub}</small>}
      </div>
      <div className="ashos-row__control">{children}</div>
    </div>
  );
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="ashos-group-box">
      {title && <h3>{title}</h3>}
      <div className="ashos-group-box__rows">{children}</div>
    </section>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="ashos-seg ashos-seg--text" role="radiogroup" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} aria-pressed={value === v} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

function Slider({ value, min, max, step, onChange, label, left, right }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string; left?: string; right?: string }) {
  return (
    <label className="ashos-slider">
      {left && <small>{left}</small>}
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} />
      {right && <small>{right}</small>}
    </label>
  );
}

/* ---------- the app ---------- */

export function Settings() {
  const os = useOS();
  const { win } = useWin();
  const [pane, setPane] = useState<SettingsPane>(win.args.pane ?? "appearance");
  const [q, setQ] = useState("");
  const key = useKeyLabel();
  const p = os.prefs;
  const set = os.setPref;

  useEffect(() => {
    if (win.args.pane) setPane(win.args.pane);
  }, [win.args.pane, win.args.nonce]);

  const current = PANES.find((x) => x.id === pane)!;
  useEffect(() => os.setTitle(win.id, current.label), [os, win.id, current.label]);

  useWindowMenus(win.id, () => [{ title: "View", items: PANES.map((x) => ({ label: x.label, checked: pane === x.id, run: () => setPane(x.id) })) }]);

  const visible = PANES.filter((x) => !q.trim() || (x.label + " " + KEYWORDS[x.id]).toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className={"ashos-split ashos-settings" + (os.mobile ? " is-compact is-stacked" : "")}>
      <aside className="ashos-sidebar" aria-label="Settings">
        <DragRegion className="ashos-sidebar__top" />
        <nav className="ashos-sidebar__scroll">
          <label className="ashos-search ashos-search--side">
            <Glyph name="search" />
            <input type="search" placeholder="Search" aria-label="Search settings" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <button type="button" className="ashos-account" onClick={() => os.launch("about")}>
            <span className="ashos-avatar ashos-avatar--sm" aria-hidden="true">
              {person.initials}
            </span>
            <span>
              <b>{person.name}</b>
              <small>Portfolio owner</small>
            </span>
          </button>
          <div className="ashos-sidebar__section">
            {visible.map((x) => (
              <button key={x.id} type="button" className={"ashos-sidebar__item" + (pane === x.id ? " is-active" : "")} onClick={() => setPane(x.id)}>
                <span className="ashos-paneicon" style={{ background: x.tint }}>
                  <Glyph name={x.glyph} />
                </span>
                <span>{x.label}</span>
              </button>
            ))}
            {!visible.length && <div className="ashos-sidebar__none">No results</div>}
          </div>
        </nav>
      </aside>

      <div className="ashos-split__main">
        <DragRegion className="ashos-toolbar">
          <h2 className="ashos-toolbar__title">{current.label}</h2>
        </DragRegion>
        <div className="ashos-settings__body ashos-scroll">
          {pane === "appearance" && (
            <>
              <Group>
                <Row label="Appearance">
                  <div className="ashos-appear">
                    {(["light", "dark", "auto"] as const).map((v) => (
                      <button key={v} type="button" aria-pressed={p.appearance === v} className="ashos-appear__opt" onClick={() => set("appearance", v)}>
                        <span className={`ashos-appear__thumb is-${v}`} aria-hidden="true">
                          <i />
                        </span>
                        <span>{v === "light" ? "Light" : v === "dark" ? "Dark" : "Auto"}</span>
                      </button>
                    ))}
                  </div>
                </Row>
                <Row label="Accent colour">
                  <div className="ashos-accents" role="radiogroup" aria-label="Accent colour">
                    {ACCENTS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        role="radio"
                        aria-checked={p.accent === a.id}
                        aria-label={a.name}
                        title={a.name}
                        className="ashos-accent"
                        style={{ background: os.appearance === "dark" ? a.dark : a.light }}
                        onClick={() => set("accent", a.id)}
                      />
                    ))}
                  </div>
                </Row>
              </Group>
              <Group>
                <Row label="Reduce transparency" sub="Makes the menu bar, dock and sidebars solid.">
                  <Switch on={p.reduceTransparency} onChange={(v) => set("reduceTransparency", v)} label="Reduce transparency" />
                </Row>
                <Row label="Display brightness">
                  <Slider value={p.brightness} min={0.35} max={1} step={0.01} onChange={(v) => set("brightness", v)} label="Display brightness" />
                </Row>
              </Group>
              <p className="ashos-note">Auto follows the portfolio&apos;s theme when ashOS opens, then your system setting. These settings only affect ashOS.</p>
            </>
          )}

          {pane === "wallpaper" && (
            <>
              <div className="ashos-wp-current">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={wallpaperById(p.wallpaper)[os.appearance]} alt="" />
                <div>
                  <b>{wallpaperById(p.wallpaper).name}</b>
                  <small>Dynamic: changes with Light and Dark appearance.</small>
                </div>
              </div>
              <Group title="Wallpapers">
                <div className="ashos-wp-grid">
                  {WALLPAPERS.map((w) => (
                    <button key={w.id} type="button" aria-pressed={p.wallpaper === w.id} className="ashos-wp" onClick={() => set("wallpaper", w.id)}>
                      <span className="ashos-wp__img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={w.light} alt="" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={w.dark} alt="" className="is-dark" />
                      </span>
                      <span>{w.name}</span>
                    </button>
                  ))}
                </div>
              </Group>
            </>
          )}

          {pane === "desktop" && (
            <>
              <Group title="Dock">
                <Row label="Size">
                  <Slider value={p.dockSize} min={36} max={72} step={1} onChange={(v) => set("dockSize", v)} label="Dock size" left="Small" right="Large" />
                </Row>
                <Row label="Magnification">
                  <Switch on={p.dockMagnification} onChange={(v) => set("dockMagnification", v)} label="Magnification" />
                </Row>
                {p.dockMagnification && (
                  <Row label="Magnification amount">
                    <Slider value={p.dockMagnify} min={1.15} max={2} step={0.05} onChange={(v) => set("dockMagnify", v)} label="Magnification amount" left="Small" right="Large" />
                  </Row>
                )}
                <Row label="Position on screen">
                  <Segmented<Prefs["dockPosition"]>
                    label="Dock position"
                    value={p.dockPosition}
                    onChange={(v) => set("dockPosition", v)}
                    options={[
                      ["left", "Left"],
                      ["bottom", "Bottom"],
                      ["right", "Right"],
                    ]}
                  />
                </Row>
                <Row label="Automatically hide and show the Dock">
                  <Switch on={p.dockAutohide} onChange={(v) => set("dockAutohide", v)} label="Automatically hide the Dock" />
                </Row>
                <Row label="Show indicators for open applications">
                  <Switch on={p.dockIndicators} onChange={(v) => set("dockIndicators", v)} label="Show indicators" />
                </Row>
              </Group>
              <Group title="Desktop">
                <Row label="Show items on Desktop">
                  <Switch on={p.desktopIcons} onChange={(v) => set("desktopIcons", v)} label="Show desktop items" />
                </Row>
                <Row label="Icon size">
                  <Slider value={p.desktopIconSize} min={44} max={84} step={2} onChange={(v) => set("desktopIconSize", v)} label="Desktop icon size" />
                </Row>
                <Row label="Sort by">
                  <select className="ashos-select" value={p.desktopSort} onChange={(e) => set("desktopSort", e.target.value as Prefs["desktopSort"])} aria-label="Sort desktop by">
                    <option value="none">None</option>
                    <option value="name">Name</option>
                    <option value="kind">Kind</option>
                  </select>
                </Row>
              </Group>
              <Group title="Finder">
                <Row label="Default view">
                  <Segmented<Prefs["finderView"]>
                    label="Finder view"
                    value={p.finderView}
                    onChange={(v) => set("finderView", v)}
                    options={[
                      ["icons", "Icons"],
                      ["list", "List"],
                    ]}
                  />
                </Row>
                <Row label="Show path bar">
                  <Switch on={p.finderPathBar} onChange={(v) => set("finderPathBar", v)} label="Show path bar" />
                </Row>
                <Row label="Show preview pane">
                  <Switch on={p.finderPreview} onChange={(v) => set("finderPreview", v)} label="Show preview pane" />
                </Row>
              </Group>
            </>
          )}

          {pane === "about" && (
            <>
              <div className="ashos-sysabout">
                <span className="ashos-sysabout__mark">
                  <AshMark />
                </span>
                <h1>ashOS</h1>
                <p>Version 7.0</p>
              </div>
              <Group>
                <Row label="Owner">{person.name}</Row>
                <Row label="Built with">Next.js · React · TypeScript</Row>
                <Row label="Display">
                  {os.viewport.w} × {os.viewport.h}
                </Row>
                <Row label="Appearance">{os.appearance === "dark" ? "Dark" : "Light"}</Row>
              </Group>
              <Group title="Keyboard shortcuts">
                {SHORTCUTS.map((s) => (
                  <Row key={s.label} label={s.label}>
                    <kbd className="ashos-kbd">{key(s.keys)}</kbd>
                  </Row>
                ))}
              </Group>
              <div className="ashos-settings__actions">
                <button type="button" className="ashos-btn" onClick={() => os.openPath("/Desktop/Welcome.pdf")}>
                  Open Welcome Guide
                </button>
                <button type="button" className="ashos-btn" onClick={() => (os.resetPrefs(), os.notify({ app: "settings", title: "Settings reset", body: "ashOS is back to its defaults." }))}>
                  Reset All Settings
                </button>
                <button type="button" className="ashos-btn" onClick={os.exitToPortfolio}>
                  Exit to Portfolio
                </button>
              </div>
              <p className="ashos-note">ashOS is an original design inspired by familiar desktop conventions. It isn&apos;t affiliated with or endorsed by Apple.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const KEYWORDS: Record<SettingsPane, string> = {
  appearance: "dark light mode theme accent colour color transparency brightness",
  wallpaper: "background desktop picture",
  desktop: "dock magnification size position hide icons finder sort",
  about: "version shortcuts keyboard reset",
};
