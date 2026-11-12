"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as RKeyboardEvent } from "react";
import { docToLines } from "../data/doc";
import { ancestry, basename, formatSize, kindLabel, searchFs, TRASH, type FsNode } from "../data/fs";
import { useOS, useWindowMenus, type MenuItem } from "../state/os";
import { itemMenu } from "../ui/DesktopIcons";
import { Cover, Glyph, NodeIcon, type GlyphName } from "../ui/icons";
import { DragRegion, useWin } from "../ui/Window";

const RECENTS = "recents";
type Loc = string; // a path, or "recents"
type SortKey = "name" | "date" | "size" | "kind";

const SIDEBAR: { title: string; items: { loc: Loc; label: string; glyph: GlyphName }[] }[] = [
  {
    title: "Favourites",
    items: [
      { loc: RECENTS, label: "Recents", glyph: "clock" },
      { loc: "/Applications", label: "Applications", glyph: "apps" },
      { loc: "/Desktop", label: "Desktop", glyph: "desktop" },
      { loc: "/Documents", label: "Documents", glyph: "doc" },
      { loc: "/Downloads", label: "Downloads", glyph: "download" },
      { loc: "/Projects", label: "Projects", glyph: "code" },
    ],
  },
  {
    title: "Portfolio",
    items: [
      { loc: "/Documents/About Me", label: "About Me", glyph: "person" },
      { loc: "/Documents/Experience", label: "Experience", glyph: "briefcase" },
      { loc: "/Documents/Skills", label: "Skills", glyph: "sparkles" },
      { loc: "/Documents/Achievements", label: "Achievements", glyph: "trophy" },
      { loc: "/Documents/Writing", label: "Writing", glyph: "pencil" },
      { loc: "/Documents/Contact", label: "Contact", glyph: "envelope" },
    ],
  },
  {
    title: "Locations",
    items: [
      { loc: "/", label: "Macintosh HD", glyph: "disk" },
      { loc: TRASH, label: "Trash", glyph: "trash" },
    ],
  },
];

const locName = (loc: Loc) => (loc === RECENTS ? "Recents" : basename(loc));

export function Finder() {
  const os = useOS();
  const { win } = useWin();
  const start: Loc = win.args.location === "recents" ? RECENTS : win.args.path ?? "/Desktop";

  const [hist, setHist] = useState<{ list: Loc[]; i: number }>({ list: [start], i: 0 });
  const loc = hist.list[hist.i];
  const [view, setView] = useState(os.prefs.finderView);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [sel, setSel] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "here">("all");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeAhead = useRef({ s: "", t: 0 });

  const go = useCallback((next: Loc) => {
    setHist((h) => (h.list[h.i] === next ? h : { list: [...h.list.slice(0, h.i + 1), next], i: h.i + 1 }));
    setSel([]);
    setQuery("");
    setRenaming(null);
    setDrawer(false);
  }, []);
  // Back / Forward skip folders that have since been renamed or trashed
  // (and repeats of the current one).
  const step = (d: 1 | -1) => {
    let j = hist.i + d;
    const dead = (l: Loc) => l === loc || (l !== RECENTS && !os.fs[l]);
    while (hist.list[j] !== undefined && dead(hist.list[j])) j += d;
    return hist.list[j] === undefined ? -1 : j;
  };
  const backTo = step(-1);
  const fwdTo = step(1);
  const back = () => backTo >= 0 && (setHist((h) => ({ ...h, i: backTo })), setSel([]), setQuery(""));
  const fwd = () => fwdTo >= 0 && (setHist((h) => ({ ...h, i: fwdTo })), setSel([]), setQuery(""));
  const up = () => loc !== RECENTS && loc !== "/" && go(os.fs[loc]?.parent ?? "/");

  // Re-targeted from outside (e.g. Go menu with an existing window).
  const nonce = win.args.nonce;
  useEffect(() => {
    if (nonce) go(win.args.location === "recents" ? RECENTS : win.args.path ?? "/");
  }, [nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  // A folder that disappears (renamed / trashed) falls back to its parent,
  // in place of the dead history entry rather than as a new one.
  useEffect(() => {
    if (loc === RECENTS || os.fs[loc]) return;
    const to = [...ancestry(loc)].reverse().find((p) => os.fs[p]) ?? "/";
    setHist((h) => {
      // Already one step back? Drop the dead entry instead.
      if (h.list[h.i - 1] === to) return { list: h.list.filter((_, j) => j !== h.i), i: h.i - 1 };
      return { list: h.list.map((l, j) => (j === h.i ? to : l)), i: h.i };
    });
    setSel([]);
    setQuery("");
    setRenaming(null);
    setDrawer(false);
  }, [loc, os.fs]);

  const searching = query.trim().length > 0;
  const title = searching ? `Searching “${query.trim()}”` : locName(loc);
  useEffect(() => os.setTitle(win.id, searching ? "Search" : locName(loc)), [os, win.id, loc, searching]);

  const items: FsNode[] = useMemo(() => {
    let list: FsNode[];
    if (searching) list = searchFs(os.fs, query, scope === "here" && loc !== RECENTS ? loc : "/");
    else if (loc === RECENTS) list = os.recents.map((p) => os.fs[p]).filter(Boolean);
    else list = (os.fs[loc]?.children ?? []).map((p) => os.fs[p]).filter(Boolean);
    if (loc === RECENTS && !searching) return list;
    const val = (n: FsNode) =>
      sort.key === "size" ? n.size ?? -1 : sort.key === "kind" ? kindLabel(n) : sort.key === "date" ? n.modified ?? "" : n.name;
    return [...list].sort((a, b) => {
      if (sort.key === "name" && !!a.children !== !!b.children) return a.children ? -1 : 1;
      const x = val(a);
      const y = val(b);
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
      return c * sort.dir || a.name.localeCompare(b.name);
    });
  }, [os.fs, os.recents, loc, query, scope, searching, sort]);

  const selected = sel.map((p) => os.fs[p]).filter(Boolean);
  const focusNode = selected[selected.length - 1] ?? null;

  const openNode = (n: FsNode) => {
    if (n.kind === "folder" || n.kind === "volume") go(n.path);
    else os.openPath(n.path);
  };

  const newFolder = () => {
    const dir = loc === RECENTS ? "/Desktop" : loc;
    const p = os.createFolder(dir);
    if (p) {
      if (dir !== loc) go(dir);
      setSel([p]);
      setTimeout(() => setRenaming(p), 30);
    }
  };
  const canCreate = !searching && loc !== RECENTS && loc !== "/Applications" && loc !== TRASH && !!os.fs[loc];
  const trashSel = () => selected.forEach((n) => os.moveToTrash(n.path));

  /* ---- keyboard ---- */
  const cols = () => {
    const el = bodyRef.current;
    if (!el || view === "list") return 1;
    const tile = el.querySelector<HTMLElement>(".ashos-ftile");
    return tile ? Math.max(1, Math.floor(el.clientWidth / tile.offsetWidth)) : 1;
  };
  const onKeyDown = (e: RKeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input")) return;
    const mod = e.metaKey || e.ctrlKey;
    const idx = focusNode ? items.findIndex((n) => n.path === focusNode.path) : -1;
    const pick = (i: number) => {
      const n = items[Math.max(0, Math.min(items.length - 1, i))];
      if (n) {
        setSel([n.path]);
        bodyRef.current?.querySelector(`[data-path="${CSS.escape(n.path)}"]`)?.scrollIntoView({ block: "nearest" });
      }
    };
    if (mod && e.key === "ArrowUp") return e.preventDefault(), up();
    if (mod && (e.key === "ArrowDown" || e.key === "o")) return e.preventDefault(), selected.forEach(openNode);
    if (mod && e.key === "[") return e.preventDefault(), back();
    if (mod && e.key === "]") return e.preventDefault(), fwd();
    if (mod && e.key === "a") return e.preventDefault(), setSel(items.map((n) => n.path));
    if (mod && e.key === "Backspace") return e.preventDefault(), trashSel();
    if (mod || e.altKey) return;
    if (e.key === "Enter") return e.preventDefault(), selected.forEach(openNode);
    if (e.key === " ") return e.preventDefault(), focusNode && os.setQuickLook(focusNode.path);
    if (e.key === "ArrowRight" && view === "icons") return e.preventDefault(), pick(idx + 1);
    if (e.key === "ArrowLeft" && view === "icons") return e.preventDefault(), pick(idx - 1);
    if (e.key === "ArrowDown") return e.preventDefault(), pick(idx < 0 ? 0 : idx + cols());
    if (e.key === "ArrowUp") return e.preventDefault(), pick(idx < 0 ? 0 : idx - cols());
    if (e.key === "Escape") return setSel([]);
    if (e.key.length === 1 && /\S/.test(e.key)) {
      // Type to select.
      const now = Date.now();
      typeAhead.current = { s: (now - typeAhead.current.t < 800 ? typeAhead.current.s : "") + e.key.toLowerCase(), t: now };
      const hit = items.findIndex((n) => n.name.toLowerCase().startsWith(typeAhead.current.s));
      if (hit >= 0) pick(hit);
    }
  };

  const clickItem = (e: React.MouseEvent, n: FsNode) => {
    e.stopPropagation();
    if (e.metaKey || e.ctrlKey) setSel((s) => (s.includes(n.path) ? s.filter((p) => p !== n.path) : [...s, n.path]));
    else if (e.shiftKey && focusNode) {
      const a = items.findIndex((x) => x.path === focusNode.path);
      const b = items.findIndex((x) => x.path === n.path);
      setSel(items.slice(Math.min(a, b), Math.max(a, b) + 1).map((x) => x.path));
    } else setSel([n.path]);
    const pe = e.nativeEvent as PointerEvent;
    if (pe.pointerType === "touch" && !e.metaKey) openNode(n);
  };

  const itemCtx = (e: React.MouseEvent, n: FsNode) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sel.includes(n.path)) setSel([n.path]);
    os.openContextMenu(e.clientX, e.clientY, itemMenu(os, n, { rename: () => setRenaming(n.path), open: () => openNode(n) }));
  };

  const sortItems = (k: SortKey): MenuItem => ({
    label: { name: "Name", date: "Date", size: "Size", kind: "Kind" }[k],
    checked: sort.key === k,
    run: () => setSort((s) => ({ key: k, dir: s.key === k ? s.dir : 1 })),
  });
  const setViewMode = (v: "icons" | "list") => {
    setView(v);
    os.setPref("finderView", v);
  };

  const bgCtx = (e: React.MouseEvent) => {
    e.preventDefault();
    setSel([]);
    os.openContextMenu(e.clientX, e.clientY, [
      { label: "New Folder", disabled: !canCreate, run: newFolder },
      { sep: true },
      { label: "Get Info", disabled: loc === RECENTS, run: () => os.setQuickLook(loc) },
      { sep: true },
      { label: "as Icons", checked: view === "icons", run: () => setViewMode("icons") },
      { label: "as List", checked: view === "list", run: () => setViewMode("list") },
      { label: "Sort By", submenu: (["name", "kind", "date", "size"] as SortKey[]).map(sortItems) },
      { sep: true },
      ...(loc === TRASH ? [{ label: "Empty Trash", disabled: !items.length, run: os.emptyTrash }] : []),
      { label: "New Terminal at Folder", disabled: loc === RECENTS, run: () => os.launch("terminal", { cwd: loc }, { newWindow: true }) },
    ]);
  };

  /* ---- menu bar ---- */
  useWindowMenus(win.id, () => [
    {
      title: "File",
      items: [
        { label: "New Finder Window", shortcut: "⌥N", run: () => os.launch("finder", { path: loc === RECENTS ? "/" : loc }, { newWindow: true }) },
        { label: "New Folder", disabled: !canCreate, run: newFolder },
        { label: "Open", shortcut: "⌘↓", disabled: !selected.length, run: () => selected.forEach(openNode) },
        { sep: true },
        { label: "Quick Look", shortcut: "Space", disabled: !focusNode, run: () => focusNode && os.setQuickLook(focusNode.path) },
        { label: "Get Info", disabled: !focusNode && loc === RECENTS, run: () => os.setQuickLook(focusNode?.path ?? loc) },
        { sep: true },
        { label: "Move to Trash", shortcut: "⌘⌫", disabled: !selected.some((n) => os.canModify(n.path)), run: trashSel },
        ...(loc === TRASH ? [{ label: "Empty Trash", disabled: !items.length, run: os.emptyTrash }] : []),
        { sep: true },
        { label: "Close Window", shortcut: "⌥W", run: () => os.close(win.id) },
      ],
    },
    {
      title: "Edit",
      items: [
        { label: "Copy Names", disabled: !selected.length, run: () => navigator.clipboard?.writeText(selected.map((n) => n.name).join("\n")) },
        { label: "Select All", shortcut: "⌘A", run: () => setSel(items.map((n) => n.path)) },
        { sep: true },
        { label: "Find", run: () => searchRef.current?.focus() },
      ],
    },
    {
      title: "View",
      items: [
        { label: "as Icons", checked: view === "icons", run: () => setViewMode("icons") },
        { label: "as List", checked: view === "list", run: () => setViewMode("list") },
        { sep: true },
        { label: "Sort By", submenu: (["name", "kind", "date", "size"] as SortKey[]).map(sortItems) },
        { sep: true },
        { label: os.prefs.finderSidebar ? "Hide Sidebar" : "Show Sidebar", run: () => os.setPref("finderSidebar", !os.prefs.finderSidebar) },
        { label: os.prefs.finderPreview ? "Hide Preview" : "Show Preview", run: () => os.setPref("finderPreview", !os.prefs.finderPreview) },
        { label: os.prefs.finderPathBar ? "Hide Path Bar" : "Show Path Bar", run: () => os.setPref("finderPathBar", !os.prefs.finderPathBar) },
      ],
    },
    {
      title: "Go",
      items: [
        { label: "Back", shortcut: "⌘[", disabled: backTo < 0, run: back },
        { label: "Forward", shortcut: "⌘]", disabled: fwdTo < 0, run: fwd },
        { label: "Enclosing Folder", shortcut: "⌘↑", disabled: loc === "/" || loc === RECENTS, run: up },
        { sep: true },
        ...SIDEBAR.flatMap((s) => s.items).map((it) => ({ label: it.label, checked: loc === it.loc, run: () => go(it.loc) })),
      ],
    },
  ]);

  const sidebarShown = os.mobile ? drawer : os.prefs.finderSidebar;
  const preview = os.prefs.finderPreview && !os.mobile;

  return (
    <div className={"ashos-split" + (sidebarShown ? "" : " no-sidebar") + (os.mobile ? " is-compact" : "")}>
      {sidebarShown && (
        <aside className={"ashos-sidebar" + (os.mobile ? " is-drawer" : "")} aria-label="Finder sidebar">
          <DragRegion className="ashos-sidebar__top" />
          <nav className="ashos-sidebar__scroll">
            {SIDEBAR.map((s) => (
              <div key={s.title} className="ashos-sidebar__section">
                <div className="ashos-sidebar__heading">{s.title}</div>
                {s.items.map((it) => (
                  <button
                    key={it.loc}
                    type="button"
                    className={"ashos-sidebar__item" + (loc === it.loc && !searching ? " is-active" : "")}
                    aria-current={loc === it.loc && !searching ? "page" : undefined}
                    onClick={() => go(it.loc)}
                  >
                    <Glyph name={it.glyph} />
                    <span>{it.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>
      )}
      <div className="ashos-split__main">
        <DragRegion className="ashos-toolbar">
          {os.mobile && (
            <button type="button" className="ashos-tbtn" aria-label="Toggle sidebar" onClick={() => setDrawer((d) => !d)}>
              <Glyph name="sidebar" />
            </button>
          )}
          <div className="ashos-tgroup">
            <button type="button" className="ashos-tbtn" aria-label="Back" title="Back" disabled={backTo < 0} onClick={back}>
              <Glyph name="chevronLeft" />
            </button>
            <button type="button" className="ashos-tbtn" aria-label="Forward" title="Forward" disabled={fwdTo < 0} onClick={fwd}>
              <Glyph name="chevronRight" />
            </button>
          </div>
          <h2 className="ashos-toolbar__title">{title}</h2>
          <div className="ashos-toolbar__spacer" />
          <div className="ashos-seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "icons"} aria-label="Icon view" title="Icons" onClick={() => setViewMode("icons")}>
              <Glyph name="grid" />
            </button>
            <button type="button" aria-pressed={view === "list"} aria-label="List view" title="List" onClick={() => setViewMode("list")}>
              <Glyph name="list" />
            </button>
          </div>
          {!os.mobile && (
            <button
              type="button"
              className="ashos-tbtn"
              aria-label="Sort"
              title="Sort By"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                os.openContextMenu(r.left, r.bottom + 4, (["name", "kind", "date", "size"] as SortKey[]).map(sortItems));
              }}
            >
              <Glyph name="sort" />
            </button>
          )}
          {!os.mobile && (
            <button
              type="button"
              className={"ashos-tbtn" + (preview ? " is-on" : "")}
              aria-label="Show preview"
              aria-pressed={preview}
              title="Preview"
              onClick={() => os.setPref("finderPreview", !os.prefs.finderPreview)}
            >
              <Glyph name="info" />
            </button>
          )}
          <label className="ashos-search">
            <Glyph name="search" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search"
              aria-label="Search files"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSel([]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setQuery("");
                  bodyRef.current?.focus();
                }
              }}
            />
          </label>
        </DragRegion>

        {searching && (
          <div className="ashos-scopebar">
            <span>Search:</span>
            <button type="button" aria-pressed={scope === "all"} onClick={() => setScope("all")}>
              This Mac
            </button>
            {loc !== RECENTS && loc !== "/" && (
              <button type="button" aria-pressed={scope === "here"} onClick={() => setScope("here")}>
                “{locName(loc)}”
              </button>
            )}
          </div>
        )}

        <div className="ashos-finder__row">
          <div
            ref={bodyRef}
            className={"ashos-finder__body ashos-scroll" + (view === "list" || searching ? " is-list" : " is-icons")}
            tabIndex={0}
            role={view === "list" || searching ? "grid" : "listbox"}
            aria-label={`${title} contents`}
            aria-multiselectable="true"
            onKeyDown={onKeyDown}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("ashos-flist__rows")) setSel([]);
            }}
            onContextMenu={(e) => {
              if (!(e.target as HTMLElement).closest("[data-path]")) bgCtx(e);
            }}
          >
            {items.length === 0 ? (
              <div className="ashos-empty">
                {searching ? (
                  <>No results for “{query.trim()}”</>
                ) : loc === RECENTS ? (
                  <>Files you open appear here.</>
                ) : (
                  <>
                    <span>This folder is empty.</span>
                    {os.fs[loc]?.info && <small>{os.fs[loc].info}</small>}
                  </>
                )}
              </div>
            ) : view === "list" || searching ? (
              <div className="ashos-flist" role="rowgroup">
                <div className="ashos-flist__head" role="row">
                  {(["name", "date", "size", "kind"] as SortKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="columnheader"
                      aria-sort={sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                      className={`ashos-flist__col ashos-flist__col--${k}` + (sort.key === k ? " is-sorted" : "")}
                      onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (-s.dir as 1 | -1) : 1 }))}
                    >
                      {{ name: "Name", date: "Date", size: "Size", kind: "Kind" }[k]}
                      {sort.key === k && <Glyph name={sort.dir === 1 ? "chevronUp" : "chevronDown"} />}
                    </button>
                  ))}
                </div>
                <div className="ashos-flist__rows">
                  {items.map((n) => (
                    <div
                      key={n.path}
                      data-path={n.path}
                      role="row"
                      aria-selected={sel.includes(n.path)}
                      className={"ashos-flist__row" + (sel.includes(n.path) ? " is-selected" : "")}
                      onClick={(e) => clickItem(e, n)}
                      onDoubleClick={() => openNode(n)}
                      onContextMenu={(e) => itemCtx(e, n)}
                    >
                      <span className="ashos-flist__col ashos-flist__col--name" role="gridcell">
                        <NodeIcon node={n} className="ashos-flist__icon" />
                        {renaming === n.path ? <Rename n={n} onDone={(p) => (setRenaming(null), p && setSel([p]))} /> : <span className="ashos-flist__name">{n.name}</span>}
                        {searching && <small className="ashos-flist__where">{n.parent === "/" ? "Macintosh HD" : basename(n.parent ?? "/")}</small>}
                      </span>
                      <span className="ashos-flist__col ashos-flist__col--date" role="gridcell">
                        {n.modified ?? "--"}
                      </span>
                      <span className="ashos-flist__col ashos-flist__col--size" role="gridcell">
                        {n.children ? "--" : formatSize(n.size)}
                      </span>
                      <span className="ashos-flist__col ashos-flist__col--kind" role="gridcell">
                        {kindLabel(n)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ashos-fgrid">
                {items.map((n) => (
                  <div
                    key={n.path}
                    data-path={n.path}
                    role="option"
                    aria-selected={sel.includes(n.path)}
                    aria-label={`${n.name}, ${kindLabel(n)}`}
                    className={"ashos-ftile" + (sel.includes(n.path) ? " is-selected" : "")}
                    onClick={(e) => clickItem(e, n)}
                    onDoubleClick={() => openNode(n)}
                    onContextMenu={(e) => itemCtx(e, n)}
                  >
                    <NodeIcon node={n} className="ashos-ftile__icon" />
                    {renaming === n.path ? <Rename n={n} onDone={(p) => (setRenaming(null), p && setSel([p]))} /> : <span className="ashos-ftile__label">{n.name}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {preview && <PreviewPane node={focusNode ?? (loc !== RECENTS ? os.fs[loc] : null)} onOpen={openNode} />}
        </div>

        {os.prefs.finderPathBar && (
          <footer className="ashos-pathbar">
            <div className="ashos-pathbar__crumbs" aria-label="Path">
              {loc === RECENTS ? (
                <span className="ashos-crumb">
                  <Glyph name="clock" /> Recents
                </span>
              ) : (
                ancestry(focusNode?.path ?? loc).map((p, i, arr) => (
                  <span key={p} className="ashos-crumb">
                    <button type="button" onClick={() => (os.fs[p]?.children ? go(p) : setSel([p]))}>
                      {os.fs[p] && <NodeIcon node={os.fs[p]} className="ashos-crumb__icon" />}
                      {basename(p)}
                    </button>
                    {i < arr.length - 1 && <Glyph name="chevronRight" className="ashos-crumb__sep" />}
                  </span>
                ))
              )}
            </div>
            <span className="ashos-pathbar__count">
              {sel.length ? `${sel.length} of ${items.length} selected` : `${items.length} item${items.length === 1 ? "" : "s"}`}
            </span>
          </footer>
        )}
      </div>
      {os.mobile && drawer && <div className="ashos-drawer-scrim" onClick={() => setDrawer(false)} />}
    </div>
  );
}

function Rename({ n, onDone }: { n: FsNode; onDone: (path: string | null) => void }) {
  const os = useOS();
  return (
    <input
      className="ashos-rename"
      defaultValue={n.name}
      autoFocus
      aria-label="New name"
      onFocus={(e) => e.currentTarget.select()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") onDone(os.rename(n.path, e.currentTarget.value));
        else if (e.key === "Escape") onDone(null);
      }}
      onBlur={(e) => onDone(os.rename(n.path, e.currentTarget.value))}
    />
  );
}

function PreviewPane({ node, onOpen }: { node: FsNode | null; onOpen: (n: FsNode) => void }) {
  const os = useOS();
  if (!node) return <aside className="ashos-fpreview ashos-fpreview--empty">No selection</aside>;
  const excerpt = node.doc ? docToLines(node.doc, 60).filter((l) => l.trim()).slice(1, 6).join(" ") : node.info;
  return (
    <aside className="ashos-fpreview ashos-scroll" aria-label="Preview">
      <div className="ashos-fpreview__art">
        {node.kind === "image" && node.image ? <Cover seed={node.image.seed} title={node.image.title} src={node.image.src} /> : <NodeIcon node={node} className="ashos-fpreview__icon" />}
      </div>
      <h3>{node.name}</h3>
      <p className="ashos-fpreview__kind">
        {kindLabel(node)} · {node.children ? `${node.children.length} items` : formatSize(node.size)}
      </p>
      {excerpt && <p className="ashos-fpreview__text">{excerpt.slice(0, 260)}</p>}
      <dl>
        {node.modified && (
          <>
            <dt>Date</dt>
            <dd>{node.modified}</dd>
          </>
        )}
        {node.kind === "link" && (
          <>
            <dt>URL</dt>
            <dd>{node.href ?? "Not linked yet"}</dd>
          </>
        )}
      </dl>
      <div className="ashos-fpreview__actions">
        <button type="button" className="ashos-btn" onClick={() => onOpen(node)}>
          Open
        </button>
        <button type="button" className="ashos-btn" onClick={() => os.setQuickLook(node.path)}>
          Quick Look
        </button>
      </div>
    </aside>
  );
}
