"use client";

import { useEffect, useState } from "react";
import { safeName } from "../data/fs";
import { achievements, moreLinks, sectionTitles as S, work, type Work } from "../data/portfolio";
import { useOS, useWindowMenus } from "../state/os";
import { DemoVideo } from "../ui/Demo";
import { Cover, Glyph } from "../ui/icons";
import { DragRegion, useWin } from "../ui/Window";

type Win = (typeof achievements)[number];
const findWork = (id?: string) => work.find((w) => w.id === id);
const findWin = (id?: string) => achievements.find((w) => w.id === id);

export function Projects() {
  const os = useOS();
  const { win } = useWin();
  const [id, setId] = useState<string>(win.args.project && (findWork(win.args.project) || findWin(win.args.project)) ? win.args.project : work[0]?.id ?? "");

  useEffect(() => {
    if (win.args.project) setId(win.args.project);
  }, [win.args.project, win.args.nonce]);

  const project = findWork(id);
  const hack = findWin(id);
  const title = project?.name ?? hack?.event ?? S.work.title;
  useEffect(() => os.setTitle(win.id, `Projects — ${title}`), [os, win.id, title]);

  const all = [...work.map((w) => w.id), ...achievements.map((w) => w.id)];
  const step = (d: number) => setId(all[(all.indexOf(id) + d + all.length) % all.length]);
  const folderOf = (w: Work) => `/Projects/${safeName(`${w.num} ${w.name}`)}`;

  const visit = (href: string | null) => href && os.launch("safari", { url: href });

  useWindowMenus(win.id, () => [
    {
      title: "View",
      items: [
        ...work.map((w) => ({ label: w.name, checked: id === w.id, run: () => setId(w.id) })),
        { sep: true },
        ...achievements.map((w) => ({ label: w.event, checked: id === w.id, run: () => setId(w.id) })),
      ],
    },
    {
      title: "Go",
      items: [
        { label: "Previous", run: () => step(-1) },
        { label: "Next", run: () => step(1) },
        { sep: true },
        { label: "Show in Finder", run: () => os.launch("finder", { path: project ? folderOf(project) : "/Projects/Additional Projects" }, { newWindow: true }) },
      ],
    },
  ]);

  return (
    <div className={"ashos-split" + (os.mobile ? " is-compact is-stacked" : "")}>
      <aside className="ashos-sidebar" aria-label="Projects">
        <DragRegion className="ashos-sidebar__top" />
        <nav className="ashos-sidebar__scroll">
          <div className="ashos-sidebar__section">
            <div className="ashos-sidebar__heading">{S.work.title}</div>
            {work.map((w) => (
              <button key={w.id} type="button" className={"ashos-sidebar__item ashos-sidebar__item--tall" + (id === w.id ? " is-active" : "")} onClick={() => setId(w.id)}>
                <span className="ashos-sidebar__thumb">
                  <Cover seed={Number(w.num)} title={w.name} src={w.screenshotSrc} alt={w.alt} />
                </span>
                <span className="ashos-sidebar__two">
                  <span>{w.name}</span>
                  <small>
                    {w.kind} · {w.year}
                  </small>
                </span>
              </button>
            ))}
          </div>
          <div className="ashos-sidebar__section">
            <div className="ashos-sidebar__heading">{S.wins.title}</div>
            {achievements.map((w) => (
              <button key={w.id} type="button" className={"ashos-sidebar__item" + (id === w.id ? " is-active" : "")} onClick={() => setId(w.id)}>
                <Glyph name="trophy" />
                <span>
                  {w.event} <small className="ashos-dim-text">{w.place}</small>
                </span>
              </button>
            ))}
          </div>
        </nav>
      </aside>
      <div className="ashos-split__main">
        <DragRegion className="ashos-toolbar">
          <div className="ashos-tgroup">
            <button type="button" className="ashos-tbtn" aria-label="Previous project" onClick={() => step(-1)}>
              <Glyph name="chevronLeft" />
            </button>
            <button type="button" className="ashos-tbtn" aria-label="Next project" onClick={() => step(1)}>
              <Glyph name="chevronRight" />
            </button>
          </div>
          <h2 className="ashos-toolbar__title">{title}</h2>
          <div className="ashos-toolbar__spacer" />
          <button
            type="button"
            className="ashos-tbtn"
            title="Show in Finder"
            aria-label="Show in Finder"
            onClick={() => os.launch("finder", { path: project ? folderOf(project) : "/Projects/Additional Projects" }, { newWindow: true })}
          >
            <Glyph name="folder" />
          </button>
          {moreLinks.allProjects && (
            <button type="button" className="ashos-tbtn" title="All projects" aria-label="All projects" onClick={() => visit(moreLinks.allProjects)}>
              <Glyph name="external" />
            </button>
          )}
        </DragRegion>

        <div className="ashos-proj ashos-scroll">
          {project && <ProjectDetail key={project.id} w={project} visit={visit} hidden={win.minimized} />}
          {hack && <HackDetail w={hack} visit={visit} />}
        </div>
      </div>
    </div>
  );
}

function LinkButton({ label, href, glyph, visit, primary }: { label: string; href: string | null; glyph: string; visit: (h: string | null) => void; primary?: boolean }) {
  return (
    <button
      type="button"
      className={"ashos-btn" + (primary && href ? " ashos-btn--primary" : "")}
      disabled={!href}
      title={href ?? "Not linked yet"}
      onClick={() => visit(href)}
    >
      <Glyph name={glyph} /> {label}
      {!href && <small> · not linked yet</small>}
    </button>
  );
}

function ProjectDetail({ w, visit, hidden }: { w: Work; visit: (h: string | null) => void; hidden: boolean }) {
  return (
    <article className="ashos-proj__inner">
      <div className="ashos-proj__shot">
        {w.demo ? (
          <DemoVideo name={w.name} demo={w.demo} alt={w.alt} hidden={hidden} />
        ) : (
          <Cover seed={Number(w.num)} title={w.name} caption={w.screenshot} src={w.screenshotSrc} alt={w.alt} />
        )}
        {!w.screenshotSrc && <span className="ashos-proj__shotnote">{w.screenshot}</span>}
      </div>
      <header className="ashos-proj__head">
        <span className="ashos-proj__num">{w.num}</span>
        <div>
          <h1>{w.name}</h1>
          <p>
            {w.kind} · {w.year}
          </p>
        </div>
      </header>
      <p className="ashos-lead">{w.blurb}</p>
      <h3 className="ashos-h3">Built with</h3>
      <div className="ashos-chips">
        {w.stack.map((x, i) => (
          <span key={i} className="ashos-chip">
            {x}
          </span>
        ))}
      </div>
      <h3 className="ashos-h3">Links</h3>
      <div className="ashos-proj__links">
        <LinkButton label="Live demo" href={w.live} glyph="globe" visit={visit} primary />
        <LinkButton label="Source code" href={w.code} glyph="code" visit={visit} />
        {w.hasCaseStudy && <LinkButton label="Case study" href={w.caseStudy} glyph="doc" visit={visit} />}
      </div>
    </article>
  );
}

function HackDetail({ w, visit }: { w: Win; visit: (h: string | null) => void }) {
  return (
    <article className="ashos-proj__inner">
      {w.image && (
        <div className="ashos-proj__shot">
          <Cover seed={Number(w.num)} title={w.project ?? w.event} src={w.image} alt={w.alt} />
        </div>
      )}
      {!w.image && (
        <div className="ashos-proj__trophy">
          <Glyph name="trophy" />
          <span>{w.place}</span>
        </div>
      )}
      <header className="ashos-proj__head">
        <div>
          <h1>{w.project ?? w.event}</h1>
          <p>
            {w.project ? `${w.place} · ${w.event} · ${w.year}` : `${S.wins.title} · ${w.year}`}
          </p>
        </div>
      </header>
      <p className="ashos-lead">{w.what}</p>
      {w.steps.length > 0 && (
        <>
          <h3 className="ashos-h3">How it works</h3>
          <ol className="ashos-principles">
            {w.steps.map((s, i) => (
              <li key={s.label}>
                <span className="ashos-principles__n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <b>{s.label}</b>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
      {w.stack.length > 0 && (
        <>
          <h3 className="ashos-h3">Built with</h3>
          <div className="ashos-chips">
            {w.stack.map((x) => (
              <span key={x} className="ashos-chip">
                {x}
              </span>
            ))}
          </div>
        </>
      )}
      {(w.live || w.code) && (
        <>
          <h3 className="ashos-h3">Links</h3>
          <div className="ashos-proj__links">
            {w.live && <LinkButton label="Live demo" href={w.live} glyph="globe" visit={visit} primary />}
            {w.code && <LinkButton label="Source code" href={w.code} glyph="code" visit={visit} />}
          </div>
        </>
      )}
    </article>
  );
}
