"use client";

import { useEffect, useState } from "react";
import {
  achievements,
  approach,
  experience,
  kindWords,
  localNow,
  person,
  sectionTitles as S,
  toolkit,
} from "../data/portfolio";
import { useOS, useWindowMenus } from "../state/os";
import { Glyph } from "../ui/icons";
import { useClock } from "../ui/MenuBar";
import { DragRegion, useWin } from "../ui/Window";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "experience", label: S.experience.title },
  { id: "wins", label: "Wins" },
  { id: "toolkit", label: S.toolkit.title },
  { id: "approach", label: S.approach.title },
  { id: "words", label: S.words.title },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function About() {
  const os = useOS();
  const { win } = useWin();
  const [tab, setTab] = useState<Tab>((TABS.find((t) => t.id === win.args.tab)?.id ?? "overview") as Tab);
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
    <div className="ashos-about">
      <DragRegion className="ashos-toolbar ashos-toolbar--inset ashos-toolbar--center">
        <h2 className="ashos-toolbar__title">About Me</h2>
        <div className="ashos-toolbar__spacer" />
        {os.viewport.w < 900 || os.mobile ? (
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
          <div className="ashos-avatar" aria-hidden="true">
            {person.initials}
          </div>
          <div className="ashos-profile__text">
            <h1>{person.name}</h1>
            <p>{person.role}</p>
            <div className="ashos-profile__chips">
              <span className="ashos-pill ashos-pill--status">
                <span className="ashos-status-dot" /> {person.status}
              </span>
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
              <div className="ashos-chips">
                {person.hobbies.map((h, i) => (
                  <span key={i} className="ashos-chip">
                    {h}
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
                    <p>{j.what}</p>
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
              {toolkit.map((g) => (
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
