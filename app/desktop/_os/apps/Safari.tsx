"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchFs } from "../data/fs";
import { contact, moreLinks, person, sectionTitles as S, work, writing } from "../data/portfolio";
import { useOS, useWindowMenus } from "../state/os";
import { Glyph, NodeIcon } from "../ui/icons";
import { DragRegion, useWin } from "../ui/Window";

const START = "ashos:start";

// Sites that refuse to be framed (X-Frame-Options / CSP); shown as a card instead.
const NO_FRAME = ["github.com", "linkedin.com", "x.com", "twitter.com", "google.com", "medium.com", "dev.to", "youtube.com", "vercel.com"];

type Page =
  | { kind: "start" }
  | { kind: "unlinked"; name: string }
  | { kind: "self" }
  | { kind: "frame"; src: string; host: string; local: boolean }
  | { kind: "card"; url: string; host: string }
  | { kind: "search"; q: string };

// A site path ("/about"), not a protocol-relative URL ("//host", which the
// browser reads as another site).
const isLocal = (url: string) => /^\/(?![/\\])/.test(url);

// ashOS's own page: framing it would run ashOS inside itself.
const isAshOS = (u: URL) => /^\/desktop(\/|$)/i.test(u.pathname);

function toPage(url: string): Page {
  if (url === START) return { kind: "start" };
  if (url.startsWith("ashos:unlinked")) return { kind: "unlinked", name: new URLSearchParams(url.split("?")[1] ?? "").get("name") ?? "This link" };
  if (url.startsWith("ashos:search")) return { kind: "search", q: new URLSearchParams(url.split("?")[1] ?? "").get("q") ?? "" };
  try {
    const u = new URL(/^[/\\]{2}/.test(url) ? "https:" + url : url, location.origin);
    const host = u.hostname.replace(/^www\./, "");
    if ((u.origin === location.origin || host === person.siteHost) && isAshOS(u)) return { kind: "self" };
    if (u.origin === location.origin) return { kind: "frame", src: u.pathname + u.search + u.hash, host: person.siteHost, local: true };
    if (NO_FRAME.some((h) => host === h || host.endsWith("." + h))) return { kind: "card", url: u.href, host };
    return { kind: "frame", src: u.href, host, local: false };
  } catch {
    return { kind: "search", q: url };
  }
}

/** Turn whatever was typed into a URL (or a portfolio search). */
function normalise(raw: string): string {
  const v = raw.trim();
  if (!v) return START;
  if (/^[/\\]{2}/.test(v)) return "https:" + v;
  if (/^(https?:|ashos:)/.test(v) || v.startsWith("/")) return v;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) return "https://" + v;
  return `ashos:search?q=${encodeURIComponent(v)}`;
}

const displayUrl = (url: string) => {
  if (url === START) return "";
  if (url.startsWith("ashos:")) return url.startsWith("ashos:search") ? new URLSearchParams(url.split("?")[1]).get("q") ?? "" : "";
  if (isLocal(url)) return person.siteHost + (url === "/" ? "" : url);
  return url.replace(/^(https?:)?[/\\]{2}(www\.)?/, "").replace(/\/$/, "");
};

export function Safari() {
  const os = useOS();
  const { win } = useWin();
  const [hist, setHist] = useState<{ list: string[]; i: number }>({ list: [win.args.url ?? START], i: 0 });
  const url = hist.list[hist.i];
  const [draft, setDraft] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const page = useMemo(() => toPage(url), [url]);

  const go = (next: string) => {
    // The page already showing: reload it (the frame may have moved on).
    if (next === url) setReloadKey((k) => k + 1);
    else setHist((h) => ({ list: [...h.list.slice(0, h.i + 1), next], i: h.i + 1 }));
    setDraft(null);
  };

  useEffect(() => {
    if (win.args.nonce && win.args.url) go(win.args.url);
  }, [win.args.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setLoading(page.kind === "frame"), [page, reloadKey]);

  const pageTitle =
    page.kind === "start" ? "Start Page" : page.kind === "unlinked" ? page.name : page.kind === "self" ? "ashOS" : page.kind === "search" ? `“${page.q}”` : page.kind === "frame" && page.local ? person.title : page.host;
  useEffect(() => os.setTitle(win.id, pageTitle), [os, win.id, pageTitle]);

  const external = page.kind === "frame" ? (page.local ? new URL(page.src, location.origin).href : page.src) : page.kind === "card" ? page.url : null;

  useWindowMenus(win.id, () => [
    {
      title: "File",
      items: [
        { label: "New Window", shortcut: "⌥N", run: () => os.launch("safari", {}, { newWindow: true }) },
        { label: "Open Location…", run: () => field.current?.focus() },
        { label: "Open Page in New Browser Tab", disabled: !external, run: () => external && window.open(external, "_blank", "noopener") },
        { sep: true },
        { label: "Close Window", shortcut: "⌥W", run: () => os.close(win.id) },
      ],
    },
    {
      title: "View",
      items: [
        { label: "Reload Page", disabled: page.kind !== "frame", run: () => setReloadKey((k) => k + 1) },
        { label: "Start Page", run: () => go(START) },
      ],
    },
    {
      title: "History",
      items: [
        { label: "Back", disabled: hist.i === 0, run: () => setHist((h) => ({ ...h, i: Math.max(0, h.i - 1) })) },
        { label: "Forward", disabled: hist.i >= hist.list.length - 1, run: () => setHist((h) => ({ ...h, i: Math.min(h.list.length - 1, h.i + 1) })) },
        { sep: true },
        ...hist.list
          .slice(-8)
          .reverse()
          .map((u) => ({ label: displayUrl(u) || "Start Page", run: () => go(u) })),
      ],
    },
  ]);

  const secure = external?.startsWith("https:") || page.kind === "frame";

  return (
    <div className="ashos-safari">
      <DragRegion className="ashos-toolbar ashos-toolbar--inset ashos-safari__bar">
        <div className="ashos-tgroup">
          <button type="button" className="ashos-tbtn" aria-label="Back" disabled={hist.i === 0} onClick={() => setHist((h) => ({ ...h, i: h.i - 1 }))}>
            <Glyph name="chevronLeft" />
          </button>
          <button type="button" className="ashos-tbtn" aria-label="Forward" disabled={hist.i >= hist.list.length - 1} onClick={() => setHist((h) => ({ ...h, i: h.i + 1 }))}>
            <Glyph name="chevronRight" />
          </button>
        </div>
        <form
          className="ashos-address"
          onSubmit={(e) => {
            e.preventDefault();
            go(normalise(draft ?? ""));
            field.current?.blur();
          }}
        >
          {secure && page.kind !== "start" && draft === null && <Glyph name="globe" className="ashos-address__lock" />}
          <input
            ref={field}
            value={draft ?? displayUrl(url)}
            placeholder="Search the portfolio or enter website name"
            aria-label="Address"
            spellCheck={false}
            autoComplete="off"
            onFocus={(e) => {
              const full = url.startsWith("ashos:") ? displayUrl(url) : isLocal(url) ? location.origin + url : url;
              setDraft(full);
              // Select it a frame later, unless the visitor has already typed
              // or pasted: selecting then would let the next key wipe that out.
              const el = e.target;
              requestAnimationFrame(() => el.value === full && el.select());
            }}
            onBlur={() => setDraft(null)}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), field.current?.blur())}
          />
          {loading && <span className="ashos-address__progress" />}
        </form>
        <button type="button" className="ashos-tbtn" aria-label="Reload" disabled={page.kind !== "frame"} onClick={() => setReloadKey((k) => k + 1)}>
          <Glyph name="reload" />
        </button>
        <button type="button" className="ashos-tbtn" aria-label="Open in a new browser tab" title="Open in New Tab" disabled={!external} onClick={() => external && window.open(external, "_blank", "noopener")}>
          <Glyph name="share" />
        </button>
      </DragRegion>

      <div className="ashos-safari__view">
        {page.kind === "start" && <StartPage go={go} />}
        {page.kind === "search" && <SearchPage q={page.q} />}
        {page.kind === "unlinked" && (
          <div className="ashos-webcard">
            <Glyph name="link" className="ashos-webcard__glyph" />
            <h2>{page.name} isn&apos;t linked yet</h2>
            <p>This link is still a placeholder on the portfolio. It will open here once it&apos;s added.</p>
            <button type="button" className="ashos-btn" onClick={() => go(START)}>
              Back to Start Page
            </button>
          </div>
        )}
        {page.kind === "self" && (
          <div className="ashos-webcard">
            <Glyph name="desktop" className="ashos-webcard__glyph" />
            <h2>You&apos;re already in ashOS</h2>
            <p>Opening ashOS inside its own Safari would only lead to a desktop in a desktop in a desktop. One is plenty.</p>
            <button type="button" className="ashos-btn" onClick={() => go(START)}>
              Back to Start Page
            </button>
          </div>
        )}
        {page.kind === "card" && (
          <div className="ashos-webcard">
            <span className="ashos-webcard__mono">{page.host[0]?.toUpperCase()}</span>
            <h2>{page.host}</h2>
            <p className="ashos-webcard__url">{page.url}</p>
            <p>{page.host} doesn&apos;t allow itself to be shown inside other pages, so it opens in a new browser tab.</p>
            <button type="button" className="ashos-btn ashos-btn--primary" onClick={() => window.open(page.url, "_blank", "noopener")}>
              Open {page.host} <Glyph name="external" />
            </button>
          </div>
        )}
        {page.kind === "frame" && (
          <iframe
            key={page.src + reloadKey}
            src={page.src}
            title={pageTitle}
            className="ashos-safari__frame"
            onLoad={(e) => {
              setLoading(false);
              // A link inside the site led to ashOS itself: show the card instead.
              if (!page.local) return;
              try {
                const at = e.currentTarget.contentWindow?.location;
                if (at && isAshOS(new URL(at.href))) go(at.pathname + at.search);
              } catch {}
            }}
            sandbox={page.local ? undefined : "allow-scripts allow-same-origin allow-popups allow-forms"}
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  );
}

function Tile({ label, sub, letter, hue, onClick }: { label: string; sub?: string; letter: string; hue: number; onClick?: () => void }) {
  return (
    <button type="button" className="ashos-fav" onClick={onClick} disabled={!onClick} title={onClick ? label : `${label} (not linked yet)`}>
      <span className="ashos-fav__tile" style={{ ["--h" as string]: hue }}>
        {letter}
      </span>
      <span className="ashos-fav__label">{label}</span>
      {sub && <span className="ashos-fav__sub">{sub}</span>}
    </button>
  );
}

function StartPage({ go }: { go: (u: string) => void }) {
  const os = useOS();
  const open = (href: string | null) => (href ? () => go(href) : undefined);
  return (
    <div className="ashos-start ashos-scroll">
      <section>
        <h2>Favourites</h2>
        <div className="ashos-favs">
          <Tile label="Portfolio" sub={person.siteHost} letter={person.initials} hue={255} onClick={() => go("/")} />
          <Tile label="GitHub" letter="G" hue={220} onClick={open(contact.github)} />
          <Tile label="LinkedIn" letter="in" hue={205} onClick={open(contact.linkedin)} />
          <Tile label="X" letter="X" hue={270} onClick={open(contact.x)} />
          <Tile label="Contact" sub={contact.emailLabel} letter="@" hue={280} onClick={() => os.launch("mail")} />
          {moreLinks.allProjects && <Tile label="All projects" letter="P" hue={150} onClick={open(moreLinks.allProjects)} />}
          {moreLinks.allPosts && <Tile label="All posts" letter="W" hue={20} onClick={open(moreLinks.allPosts)} />}
        </div>
      </section>
      <section>
        <h2>{S.work.title}</h2>
        <div className="ashos-start__list">
          {work.map((w, i) => (
            <div key={w.id} className="ashos-start__row">
              <span className="ashos-fav__tile ashos-fav__tile--sm" style={{ ["--h" as string]: 200 + i * 40 }}>
                {w.num}
              </span>
              <div>
                <b>{w.name}</b>
                <small>{w.kind}</small>
              </div>
              <div className="ashos-start__btns">
                <button type="button" className="ashos-btn ashos-btn--sm" disabled={!w.live} onClick={open(w.live)}>
                  Live
                </button>
                <button type="button" className="ashos-btn ashos-btn--sm" disabled={!w.code} onClick={open(w.code)}>
                  Code
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>Reading List</h2>
        <div className="ashos-start__list">
          {writing.map((p) => (
            <button key={p.id} type="button" className="ashos-start__row ashos-start__row--btn" disabled={!p.link} onClick={open(p.link)}>
              <Glyph name="doc" />
              <div>
                <b>{p.title}</b>
                <small>
                  {p.date} · {p.where}
                  {!p.link && " · not linked yet"}
                </small>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SearchPage({ q }: { q: string }) {
  const os = useOS();
  const hits = useMemo(() => searchFs(os.fs, q).slice(0, 30), [os.fs, q]);
  return (
    <div className="ashos-start ashos-scroll">
      <section>
        <h2>Results in the portfolio for “{q}”</h2>
        {hits.length ? (
          <div className="ashos-start__list">
            {hits.map((n) => (
              <button key={n.path} type="button" className="ashos-start__row ashos-start__row--btn" onClick={() => os.openPath(n.path)}>
                <NodeIcon node={n} className="ashos-start__icon" />
                <div>
                  <b>{n.name}</b>
                  <small>{n.info}</small>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="ashos-muted">Nothing matched. ashOS doesn&apos;t search the web; type a full address to visit a site.</p>
        )}
      </section>
    </div>
  );
}
