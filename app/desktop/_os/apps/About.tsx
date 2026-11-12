"use client";

import HobbyIcon from "@/components/HobbyIcon";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  achievements,
  approach,
  experience,
  headline,
  kindWords,
  localNow,
  person,
  sectionTitles as S,
  toolkitAreas,
} from "../data/portfolio";
import { useOS, useWindowMenus } from "../state/os";
import { Glyph } from "../ui/icons";
import { useClock } from "../ui/MenuBar";
import { DragRegion, useWin } from "../ui/Window";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "experience", label: S.experience.title },
  { id: "wins", label: S.wins.title },
  { id: "toolkit", label: S.toolkit.title },
  { id: "approach", label: S.approach.title },
  { id: "words", label: S.words.title },
] as const;
type Tab = (typeof TABS)[number]["id"];

/**
 * How the section switcher fits the window's toolbar, by the window's own width
 * (not the screen's): the title and tabs ("full"), the tabs alone with the
 * title kept for screen readers ("tabs"), or a menu when even that won't fit.
 */
function useToolbarFit(root: React.RefObject<HTMLDivElement | null>) {
  const [fit, setFit] = useState<"full" | "tabs" | "menu">("full");
  const tabsW = useRef(0);
  useLayoutEffect(() => {
    const bar = root.current?.firstElementChild as HTMLElement | null;
    if (!bar) return;
    const measure = () => {
      const tabs = bar.querySelector<HTMLElement>('[role="tablist"]');
      if (tabs) tabsW.current = tabs.offsetWidth;
      if (!tabsW.current) return;
      const cs = getComputedStyle(bar);
      const gap = parseFloat(cs.columnGap) || 0;
      const pads = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const title = bar.querySelector<HTMLElement>(".ashos-toolbar__title")?.scrollWidth ?? 0;
      // Title, spacer, tabs, spacer: three gaps. Without the title, two.
      const full = pads + title + tabsW.current + gap * 3;
      const bare = pads + tabsW.current + gap * 2;
      const room = bar.clientWidth;
      setFit(room >= full ? "full" : room >= bare ? "tabs" : "menu");
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(bar);
    return () => ro.disconnect();
  }, [root]);
  return fit;
}

export function About() {
  const os = useOS();
  const { win } = useWin();
  const [tab, setTab] = useState<Tab>((TABS.find((t) => t.id === win.args.tab)?.id ?? "overview") as Tab);
  const rootRef = useRef<HTMLDivElement>(null);
  const fit = useToolbarFit(rootRef);
  useClock(30_000);
  const t = localNow();

  useEffect(() => {
    const next = TABS.find((x) => x.id === win.args.tab);
    if (next) setTab(next.id);
  }, [win.args.tab, win.args.nonce]);

  useWindowMenus(win.id, () => [
    { title: "View", items: TABS.map((x) => ({ label: x.label, checked: tab === x.id, run: () => setTab(x.id) })) },
  ]);

  return (
    <div ref={rootRef} className="ashos-about">
      <DragRegion className="ashos-toolbar ashos-toolbar--inset ashos-toolbar--center">
        <h2 className={"ashos-toolbar__title" + (fit === "tabs" && !os.mobile ? " is-hidden" : "")}>About Me</h2>
        <div className="ashos-toolbar__spacer" />
        {fit === "menu" || os.mobile ? (
          <select className="ashos-select" value={tab} aria-label="Section" onChange={(e) => setTab(e.target.value as Tab)}>
            {TABS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="ashos-seg ashos-seg--text" role="tablist" aria-label="Sections">
            {TABS.map((x) => (
              <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
        )}
        <div className="ashos-toolbar__spacer" />
      </DragRegion>

      <div className="ashos-about__body ashos-scroll">
        <header className="ashos-profile">
          <div className={"ashos-avatar" + (person.photo ? " ashos-avatar--photo" : "")} aria-hidden="true">
            {person.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.photo.src} alt="" draggable={false} />
            ) : (
              person.initials
            )}
          </div>
          <div className="ashos-profile__text">
            <h1>{person.name}</h1>
            <p>{person.role}</p>
            <div className="ashos-profile__chips">
              <span className="ashos-pill ashos-pill--status">
                <span className="ashos-status-dot" /> {person.status}
              </span>
              <span className="ashos-pill">{person.availability}</span>
              <span className="ashos-pill" title={`${person.firstName}'s local time`}>
                <Glyph name="clock" /> {t.time} {t.zone} · {t.mood}
              </span>
            </div>
          </div>
          <div className="ashos-profile__actions">
            <button type="button" className="ashos-btn ashos-btn--primary" onClick={() => os.launch("mail", { compose: true })}>
              <Glyph name="envelope" /> Message
            </button>
            <button type="button" className="ashos-btn" onClick={() => os.launch("resume")}>
              Résumé
            </button>
            <button type="button" className="ashos-btn" onClick={() => os.launch("projects")}>
              Projects
            </button>
          </div>
        </header>

        <section className="ashos-about__panel" role="tabpanel" aria-label={TABS.find((x) => x.id === tab)?.label}>
          {tab === "overview" && (
            <>
              <p className="ashos-lead">{person.lead}</p>
              <p className="ashos-body">{person.bio}</p>
              <div className="ashos-facts">
                {person.facts.map((f) => (
                  <div key={f.label} className="ashos-fact">
                    <span>{f.label}</span>
                    <b>{f.value}</b>
                  </div>
                ))}
                <div className="ashos-fact">
                  <span>Local time</span>
                  <b>
                    {t.time} {t.zone}
                  </b>
                </div>
              </div>
              <h3 className="ashos-h3">{S.about.title}</h3>
              {headline(S.about) && (
                <p className="ashos-about__headline">
                  {S.about.line}
                  <em>{S.about.accent}</em>
                </p>
              )}
              <div className="ashos-chips">
                {person.hobbyChips.map((h) => (
                  <span key={h.label} className="ashos-chip ashos-chip--icon">
                    <HobbyIcon name={h.icon} className="ashos-chip__icon" />
                    {h.label}
                  </span>
                ))}
                <span className="ashos-chip ashos-chip--soft">{person.punctuation}</span>
              </div>
            </>
          )}

          {tab === "experience" && (
            <ol className="ashos-timeline">
              {experience.map((j) => (
                <li key={j.id}>
                  <span className="ashos-timeline__when">{j.when}</span>
                  <div>
                    <b>{j.role}</b>
                    <span className="ashos-timeline__org">{j.org}</span>
                    <ul className="ashos-timeline__points">
                      {j.points.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {tab === "wins" && (
            <div className="ashos-cards">
              {achievements.map((w) => (
                <button key={w.id} type="button" className="ashos-card" onClick={() => os.launch("projects", { project: w.id })}>
                  <span className="ashos-card__badge">
                    <Glyph name="trophy" /> {w.place}
                  </span>
                  <b>{w.event}</b>
                  <p>{w.what}</p>
                  <small>{w.year}</small>
                </button>
              ))}
            </div>
          )}

          {tab === "toolkit" && (
            <div className="ashos-groups">
              {toolkitAreas.map((a) => (
                <section key={a.id} className="ashos-area">
                  <h2 className="ashos-area__title">
                    {a.title}
                    <span>;</span>
                  </h2>
                  {a.groups.map((g) => (
                <div key={g.title} className="ashos-group">
                  <h3 className="ashos-h3">{g.title}</h3>
                  <div className="ashos-chips">
                    {g.items.map((x, i) => (
                      <span key={i} className="ashos-chip">
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
                  ))}
                </section>
              ))}
            </div>
          )}

          {tab === "approach" && (
            <ol className="ashos-principles">
              {approach.map((p, i) => (
                <li key={p.title}>
                  <span className="ashos-principles__n">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <b>{p.title}</b>
                    <p>{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {tab === "words" && (
            <div className="ashos-quotes">
              {kindWords.map((q, i) => (
                <figure key={i}>
                  <blockquote>“{q.quote}”</blockquote>
                  <figcaption>{q.by}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
