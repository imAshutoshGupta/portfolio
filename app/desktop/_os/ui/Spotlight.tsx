"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { APPS, APP_ORDER, type AppId } from "../data/apps";
import { docText } from "../data/doc";
import { dirname, kindLabel, TRASH, walk } from "../data/fs";
import { achievements, contact, person, sectionTitles as S, work } from "../data/portfolio";
import { useOS, type OS } from "../state/os";
import { AppIcon, Glyph, NodeIcon } from "./icons";

type Result = {
  id: string;
  group: string;
  title: string;
  sub: string;
  icon: ReactNode;
  keywords: string;
  body?: string;
  path?: string;
  run: () => void;
};

const GROUP_ORDER = ["Applications", "Projects", "Portfolio", "Folders", "Documents", "Links", "System Settings"];

function buildIndex(os: OS): Result[] {
  const out: Result[] = [];
  for (const id of APP_ORDER) {
    const a = APPS[id];
    out.push({
      id: "app:" + id,
      group: "Applications",
      title: a.name,
      sub: a.description,
      icon: <AppIcon app={id} />,
      keywords: [a.bundle, ...(a.keywords ?? [])].join(" "),
      run: () => os.launch(id),
    });
  }
  for (const w of work) {
    out.push({
      id: "project:" + w.id,
      group: "Projects",
      title: w.name,
      sub: `${w.kind} · ${w.year}`,
      icon: <AppIcon app="projects" />,
      keywords: [w.kind, w.year, ...w.stack].join(" "),
      body: w.blurb,
      run: () => os.launch("projects", { project: w.id }),
    });
  }
  for (const w of achievements) {
    out.push({
      id: "win:" + w.id,
      group: "Projects",
      title: w.event,
      sub: `${w.place} · ${w.year}`,
      icon: <AppIcon app="projects" />,
      keywords: "hackathon win achievement " + w.place,
      body: w.what,
      run: () => os.launch("projects", { project: w.id }),
    });
  }
  const section = (title: string, sub: string, app: AppId, run: () => void, keywords = "") =>
    out.push({ id: "section:" + title, group: "Portfolio", title, sub, icon: <AppIcon app={app} />, keywords, run });
  section("About Me", person.role, "about", () => os.launch("about", { tab: "overview" }), "bio profile who");
  section(S.experience.title, "Roles and companies", "about", () => os.launch("about", { tab: "experience" }), "jobs career work history");
  section(S.wins.title, "Hackathons and wins", "about", () => os.launch("about", { tab: "wins" }), "achievements awards");
  section(S.words.title, "Testimonials", "about", () => os.launch("about", { tab: "words" }), "quotes testimonials references");
  section(S.toolkit.title, "Skills and tools", "about", () => os.launch("about", { tab: "toolkit" }), "skills stack tools tech");
  section(S.approach.title, "Principles", "about", () => os.launch("about", { tab: "approach" }), "principles process approach");
  section(S.about.title, "Hobbies and interests", "about", () => os.launch("about", { tab: "overview" }), "hobbies interests beyond");
  section(S.writing.title, "Posts", "finder", () => os.launch("finder", { path: "/Documents/Writing" }, { newWindow: true }), "blog posts articles");
  section("Contact", contact.emailLabel, "mail", () => os.launch("mail"), "email hire message reach");
  section(S.work.title, "All projects", "projects", () => os.launch("projects"), "projects work portfolio");

  const pane = (title: string, sub: string, p: "appearance" | "wallpaper" | "desktop" | "about", keywords: string) =>
    out.push({
      id: "pane:" + p,
      group: "System Settings",
      title,
      sub,
      icon: <AppIcon app="settings" />,
      keywords,
      run: () => os.openSettings(p),
    });
  pane("Appearance", "Light, dark and accent colour", "appearance", "dark mode light mode theme accent colour color transparency");
  pane("Wallpaper", "Choose a desktop picture", "wallpaper", "background desktop picture");
  pane("Desktop & Dock", "Dock size, magnification and desktop icons", "desktop", "dock magnification autohide icons position");
  pane("About ashOS", "Version and keyboard shortcuts", "about", "version shortcuts keyboard help");

  for (const n of walk(os.fs)) {
    if (n.kind === "app" || n.path === TRASH || n.path.startsWith(TRASH + "/")) continue;
    const group = n.kind === "folder" ? "Folders" : n.kind === "link" ? "Links" : "Documents";
    out.push({
      id: "fs:" + n.path,
      group,
      title: n.name,
      sub: (dirname(n.path) === "/" ? "Macintosh HD" : dirname(n.path).slice(1).replace(/\//g, " › ")) + " · " + kindLabel(n),
      icon: <NodeIcon node={n} />,
      keywords: n.info,
      body: n.doc ? docText(n.doc) : undefined,
      path: n.path,
      run: () => os.openPath(n.path),
    });
  }
  return out;
}

function score(r: Result, q: string): number {
  const t = r.title.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.split(/[\s·—\-[\]().]+/).some((w) => w.startsWith(q))) return 60;
  if (t.includes(q)) return 45;
  if (r.keywords.toLowerCase().includes(q)) return 30;
  if (r.sub.toLowerCase().includes(q)) return 20;
  if (r.body?.toLowerCase().includes(q)) return 10;
  return 0;
}

export function Spotlight() {
  const os = useOS();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const index = useMemo(() => buildIndex(os), [os.fs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    input.current?.focus();
  }, []);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const hits = index
      .map((r) => ({ r, s: score(r, query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    if (!hits.length) return [];
    const top = hits[0].r;
    const groups = new Map<string, Result[]>();
    for (const { r } of hits.slice(1)) {
      const g = groups.get(r.group) ?? [];
      if (g.length < 5) g.push(r);
      groups.set(r.group, g);
    }
    const flat: (Result & { heading?: string })[] = [{ ...top, heading: "Top Hit" }];
    for (const g of GROUP_ORDER) {
      const list = groups.get(g);
      if (list) list.forEach((r, i) => flat.push({ ...r, heading: i === 0 ? g : undefined }));
    }
    return flat;
  }, [q, index]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const close = () => os.setOverlay(null);
  const choose = (r: Result | undefined, reveal = false) => {
    if (!r) return;
    close();
    if (reveal && r.path) os.launch("finder", { path: dirname(r.path) }, { newWindow: true });
    else r.run();
  };
  const current = results[sel];

  return (
    <div className="ashos-spot-layer" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className={"ashos-spot" + (results.length ? " has-results" : "")} role="dialog" aria-label="Spotlight Search">
        <div className="ashos-spot__field">
          <Glyph name="search" />
          <input
            ref={input}
            value={q}
            placeholder="Spotlight Search"
            aria-label="Spotlight Search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="ashos-spot-list"
            aria-activedescendant={current ? `spot-${sel}` : undefined}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((s) => Math.min(results.length - 1, s + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((s) => Math.max(0, s - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(current, e.metaKey || e.ctrlKey);
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                if (q) setQ("");
                else close();
              }
            }}
          />
          {current && <span className="ashos-spot__hint">{current.title}</span>}
        </div>
        {q.trim() && (
          <div className="ashos-spot__body">
            {results.length ? (
              <>
                <div className="ashos-spot__list" id="ashos-spot-list" role="listbox" ref={listRef}>
                  {results.map((r, i) => (
                    <div key={r.id + i}>
                      {r.heading && <div className="ashos-spot__heading">{r.heading}</div>}
                      <button
                        type="button"
                        id={`spot-${i}`}
                        data-i={i}
                        role="option"
                        aria-selected={i === sel}
                        className={"ashos-spot__row" + (i === sel ? " is-selected" : "")}
                        onPointerMove={() => setSel(i)}
                        onClick={() => choose(r)}
                      >
                        <span className="ashos-spot__icon">{r.icon}</span>
                        <span className="ashos-spot__title">{r.title}</span>
                        {i === 0 && <span className="ashos-spot__kind">{r.group.replace(/s$/, "")}</span>}
                      </button>
                    </div>
                  ))}
                </div>
                {current && (
                  <div className="ashos-spot__preview">
                    <span className="ashos-spot__big">{current.icon}</span>
                    <div className="ashos-spot__ptitle">{current.title}</div>
                    <div className="ashos-spot__psub">{current.sub}</div>
                    {current.body && <p className="ashos-spot__pbody">{current.body.slice(0, 220)}</p>}
                    <div className="ashos-spot__actions">
                      <button type="button" className="ashos-btn ashos-btn--primary" onClick={() => choose(current)}>
                        Open
                      </button>
                      {current.path && (
                        <button type="button" className="ashos-btn" onClick={() => choose(current, true)}>
                          Show in Finder
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="ashos-spot__empty">No results for “{q.trim()}”</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
