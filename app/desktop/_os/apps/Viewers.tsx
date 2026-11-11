"use client";

// Résumé, Preview and Photos: the apps that show documents and images.

import { useEffect, useMemo, useState } from "react";
import { basename, kindLabel } from "../data/fs";
import { contact, person, work } from "../data/portfolio";
import { WALLPAPERS, type WallpaperId } from "../data/wallpapers";
import { useOS, useWindowMenus } from "../state/os";
import { DocView } from "../ui/DocView";
import { Cover, Glyph } from "../ui/icons";
import { DragRegion, TitleBar, useWin } from "../ui/Window";

/* ============================================================
   Résumé — shows /resume.pdf when the site has one.
   ============================================================ */
export function Resume() {
  const os = useOS();
  const { win } = useWin();
  const known = os.resumeAvailable;
  const [state, setState] = useState<"checking" | "ok" | "missing">(known === null ? "checking" : known ? "ok" : "missing");

  useEffect(() => {
    if (known !== null) return;
    let alive = true;
    fetch(contact.resume, { method: "HEAD" })
      .then((r) => alive && setState(r.ok && (r.headers.get("content-type") ?? "").includes("pdf") ? "ok" : "missing"))
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [known]);

  useEffect(() => os.setTitle(win.id, contact.resumeFile), [os, win.id]);

  useWindowMenus(win.id, () => [
    {
      title: "File",
      items: [
        { label: "Download", disabled: state !== "ok", run: () => download() },
        { label: "Open in New Browser Tab", disabled: state !== "ok", run: () => window.open(contact.resume, "_blank", "noopener") },
        { sep: true },
        { label: "Close Window", shortcut: "⌥W", run: () => os.close(win.id) },
      ],
    },
  ]);

  const download = () => {
    const a = document.createElement("a");
    a.href = contact.resume;
    a.download = contact.resumeFile;
    a.click();
  };

  return (
    <div className="ashos-viewer">
      <TitleBar title={contact.resumeFile}>
        <button type="button" className="ashos-tbtn" aria-label="Download résumé" title="Download" disabled={state !== "ok"} onClick={download}>
          <Glyph name="download" />
        </button>
        <button type="button" className="ashos-tbtn" aria-label="Open in a new browser tab" title="Open in New Tab" disabled={state !== "ok"} onClick={() => window.open(contact.resume, "_blank", "noopener")}>
          <Glyph name="external" />
        </button>
      </TitleBar>
      <div className="ashos-viewer__stage">
        {state === "ok" && <iframe className="ashos-viewer__pdf" src={`${contact.resume}#view=FitH`} title={`${person.name} résumé`} />}
        {state === "checking" && <div className="ashos-empty">Opening…</div>}
        {state === "missing" && (
          <div className="ashos-webcard">
            <Glyph name="doc" className="ashos-webcard__glyph" />
            <h2>The résumé isn&apos;t uploaded yet</h2>
            <p>When {contact.resume.replace(/^\//, "")} is added to the site, it opens right here.</p>
            <button type="button" className="ashos-btn ashos-btn--primary" onClick={() => os.openPath("/Desktop/Portfolio Overview.pdf")}>
              Read the Portfolio Overview instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Preview — documents and images from the file system.
   ============================================================ */
export function Preview() {
  const os = useOS();
  const { win } = useWin();
  const path = win.args.path ?? "/Desktop/Welcome.pdf";
  const node = os.fs[path];
  const [zoom, setZoom] = useState(1);

  useEffect(() => os.setTitle(win.id, node ? node.name : "Preview"), [os, win.id, node]);

  useWindowMenus(win.id, () => [
    {
      title: "View",
      items: [
        { label: "Zoom In", run: () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2))) },
        { label: "Zoom Out", run: () => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2))) },
        { label: "Actual Size", run: () => setZoom(1) },
      ],
    },
    {
      title: "Go",
      items: [{ label: "Show in Finder", disabled: !node?.parent, run: () => node?.parent && os.launch("finder", { path: node.parent }, { newWindow: true }) }],
    },
  ]);

  return (
    <div className="ashos-viewer">
      <TitleBar title={node ? `${node.name}` : "Preview"}>
        <button type="button" className="ashos-tbtn" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))}>
          <Glyph name="zoomOut" />
        </button>
        <button type="button" className="ashos-tbtn" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}>
          <Glyph name="zoomIn" />
        </button>
        {node?.parent && (
          <button type="button" className="ashos-tbtn" aria-label="Show in Finder" title="Show in Finder" onClick={() => os.launch("finder", { path: node.parent! }, { newWindow: true })}>
            <Glyph name="folder" />
          </button>
        )}
      </TitleBar>
      <div className="ashos-viewer__stage ashos-scroll">
        {!node ? (
          <div className="ashos-empty">“{basename(path)}” couldn&apos;t be opened because it no longer exists.</div>
        ) : node.kind === "image" && node.image ? (
          <figure className="ashos-viewer__image" style={{ width: `${Math.round(zoom * 100)}%` }}>
            <Cover seed={node.image.seed} title={node.image.title} caption={node.image.caption} src={node.image.src} />
            <figcaption>{node.image.src ? node.image.title : `${node.image.title} · ${node.image.caption} (no image on the portfolio yet)`}</figcaption>
          </figure>
        ) : node.doc ? (
          <div className="ashos-viewer__page" style={{ fontSize: `${zoom}em` }}>
            <DocView doc={node.doc} paper={node.ext === "pdf" || node.ext === "vcf"} />
          </div>
        ) : (
          <div className="ashos-empty">{kindLabel(node)} — nothing to preview.</div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Photos — project screenshots and the wallpapers.
   ============================================================ */
type Photo = { id: string; album: "projects" | "wallpapers"; title: string; caption: string; render: () => React.ReactNode; wallpaper?: WallpaperId; project?: string; src?: string };

export function Photos() {
  const os = useOS();
  const { win } = useWin();
  const [album, setAlbum] = useState<"library" | "projects" | "wallpapers">((win.args.album as "projects") ?? "library");
  const [open, setOpen] = useState<string | null>(null);
  const dark = os.appearance === "dark";

  const photos: Photo[] = useMemo(
    () => [
      ...work.map((w) => ({
        id: w.id,
        album: "projects" as const,
        title: w.name,
        caption: w.screenshotSrc ? `${w.kind} · ${w.year}` : `${w.screenshot} · placeholder`,
        project: w.id,
        render: () => <Cover seed={Number(w.num)} title={w.name} caption={w.screenshot} src={w.screenshotSrc} />,
      })),
      ...WALLPAPERS.flatMap((wp) =>
        (["light", "dark"] as const).map((v) => ({
          id: `${wp.id}-${v}`,
          album: "wallpapers" as const,
          title: `${wp.name} (${v === "light" ? "Light" : "Dark"})`,
          caption: "ashOS wallpaper",
          wallpaper: wp.id,
          src: wp[v],
          // eslint-disable-next-line @next/next/no-img-element
          render: () => <img src={wp[v]} alt={`${wp.name} wallpaper, ${v}`} draggable={false} />,
        }))
      ),
    ],
    []
  );
  const shown = photos.filter((p) => album === "library" || p.album === album);
  const idx = shown.findIndex((p) => p.id === open);
  const current = idx >= 0 ? shown[idx] : null;

  useEffect(() => os.setTitle(win.id, `Photos — ${album === "library" ? "Library" : album === "projects" ? "Projects" : "Wallpapers"}`), [os, win.id, album]);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(document.activeElement as HTMLElement)?.closest(`[data-app="photos"]`) && os.focused?.id !== win.id) return;
      if (e.key === "Escape") (e.stopPropagation(), setOpen(null));
      if (e.key === "ArrowRight") setOpen(shown[(idx + 1) % shown.length].id);
      if (e.key === "ArrowLeft") setOpen(shown[(idx - 1 + shown.length) % shown.length].id);
    };
    addEventListener("keydown", onKey, true);
    return () => removeEventListener("keydown", onKey, true);
  }, [current, idx, shown, os.focused, win.id]);

  useWindowMenus(win.id, () => [
    {
      title: "View",
      items: [
        { label: "Library", checked: album === "library", run: () => (setAlbum("library"), setOpen(null)) },
        { label: "Projects", checked: album === "projects", run: () => (setAlbum("projects"), setOpen(null)) },
        { label: "Wallpapers", checked: album === "wallpapers", run: () => (setAlbum("wallpapers"), setOpen(null)) },
      ],
    },
  ]);

  const side = (id: typeof album, label: string, glyph: string, count: number) => (
    <button type="button" className={"ashos-sidebar__item" + (album === id ? " is-active" : "")} onClick={() => (setAlbum(id), setOpen(null))}>
      <Glyph name={glyph} />
      <span>{label}</span>
      <span className="ashos-badge ashos-badge--quiet">{count}</span>
    </button>
  );

  return (
    <div className={"ashos-split" + (os.mobile ? " is-compact is-stacked" : "")}>
      <aside className="ashos-sidebar" aria-label="Albums">
        <DragRegion className="ashos-sidebar__top" />
        <nav className="ashos-sidebar__scroll">
          <div className="ashos-sidebar__section">
            <div className="ashos-sidebar__heading">Photos</div>
            {side("library", "Library", "photos", photos.length)}
          </div>
          <div className="ashos-sidebar__section">
            <div className="ashos-sidebar__heading">Albums</div>
            {side("projects", "Projects", "code", photos.filter((p) => p.album === "projects").length)}
            {side("wallpapers", "Wallpapers", "photo", photos.filter((p) => p.album === "wallpapers").length)}
          </div>
        </nav>
      </aside>
      <div className="ashos-split__main">
        <DragRegion className="ashos-toolbar">
          {current && (
            <button type="button" className="ashos-tbtn" aria-label="Back to grid" onClick={() => setOpen(null)}>
              <Glyph name="chevronLeft" />
            </button>
          )}
          <h2 className="ashos-toolbar__title">
            {current ? current.title : album === "library" ? "Library" : album === "projects" ? "Projects" : "Wallpapers"}
            {!current && <small>{shown.length} items</small>}
          </h2>
          <div className="ashos-toolbar__spacer" />
          {current?.wallpaper && (
            <button type="button" className="ashos-btn" onClick={() => (os.setPref("wallpaper", current.wallpaper!), os.notify({ app: "photos", title: "Desktop picture set", body: current.title }))}>
              Set as Wallpaper
            </button>
          )}
          {current?.project && (
            <button type="button" className="ashos-btn" onClick={() => os.launch("projects", { project: current.project })}>
              Open in Projects
            </button>
          )}
        </DragRegion>
        {current ? (
          <div className="ashos-photo-view">
            <button type="button" className="ashos-photo-view__nav is-prev" aria-label="Previous photo" onClick={() => setOpen(shown[(idx - 1 + shown.length) % shown.length].id)}>
              <Glyph name="chevronLeft" />
            </button>
            <figure>
              {current.render()}
              <figcaption>{current.caption}</figcaption>
            </figure>
            <button type="button" className="ashos-photo-view__nav is-next" aria-label="Next photo" onClick={() => setOpen(shown[(idx + 1) % shown.length].id)}>
              <Glyph name="chevronRight" />
            </button>
          </div>
        ) : (
          <div className="ashos-photo-grid ashos-scroll">
            {shown.map((p) => (
              <button
                key={p.id}
                type="button"
                className={"ashos-photo" + (p.wallpaper && p.wallpaper === os.prefs.wallpaper && p.id.endsWith(dark ? "dark" : "light") ? " is-current" : "")}
                aria-label={p.title}
                onClick={() => setOpen(p.id)}
              >
                {p.render()}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
