import type { ReactNode } from "react";
import {
  about,
  features,
  footer,
  hero,
  jobs,
  links,
  meta,
  nav,
  posts,
  principles,
  projects,
  quotes,
  resumeLink,
  sections,
  toolAreas,
  tools,
  wins,
} from "@/content";
import { AshOSLink, AshOSTakeover } from "@/components/site/AshOS";
import BackToTop from "@/components/site/BackToTop";
import CopyEmail from "@/components/site/CopyEmail";
import FooterCta from "@/components/site/FooterCta";
import FooterStats from "@/components/site/FooterStats";
import Hero from "@/components/site/Hero";
import HobbyIcon from "@/components/HobbyIcon";
import Nav from "@/components/site/Nav";
import ProjectCard from "@/components/site/ProjectCard";
import Motion from "@/components/site/Motion";

const SECTION = "pb-[120px] max-sm:pb-[88px]";

// Structured data for search engines: who this page is about.
const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: hero.name,
  url: meta.url,
  jobTitle: hero.facts.find((f) => f.label === "Role")?.value,
  description: meta.description,
  email: links.email,
  sameAs: [links.linkedin, links.github],
};

const external = (href: string) =>
  /^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};

/** Section label; slides up from behind its mask as it enters (motionEngine.ts). */
function Label({ num, title }: { num: string; title: string }) {
  return (
    <span className="mask">
      <span data-label="" className="inline-block">
        <span className="mr-3 font-mono text-accent">{num}</span>
        {title}
      </span>
    </span>
  );
}

/** One-line section headline; the accent half is in the hero's italic serif. */
function Headline({ line, accent, className = "" }: { line: string; accent: string; className?: string }) {
  return (
    <p
      data-reveal=""
      className={"m-0 max-w-[820px] text-[34px] leading-[1.2] tracking-[-0.025em] max-sm:text-[26px] " + className}
    >
      {line}
      <em className="font-serif font-normal text-accent">{accent}</em>
    </p>
  );
}

type HeadingProps = {
  id: string;
  num: string;
  title: string;
  line?: string;
  accent?: string;
  more?: { label: string; href: string };
  mb: string;
};

function Heading({ id, num, title, line, accent, more, mb }: HeadingProps) {
  return (
    <div className={mb}>
      <div className="flex items-baseline justify-between border-t border-line pt-6">
        <h2 id={`${id}-title`} className="m-0 text-[15px] font-medium">
          <Label num={num} title={title} />
        </h2>
        {more && (
          <a href={more.href} {...external(more.href)} className="link text-[14px] text-muted">
            {more.label}
          </a>
        )}
      </div>
      {line && accent && <Headline line={line} accent={accent} className="mt-7 max-sm:mt-5" />}
    </div>
  );
}

/** A section, labelled for screen readers by its heading (`${id}-title`). */
function Section({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={SECTION}>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <div
      id="page"
      className="relative overflow-x-clip bg-bg font-sans text-fg"
    >
      <div className="relative mx-auto max-w-[1180px] px-10 max-sm:px-5">
        <a
          href="#main"
          className="absolute top-3 left-10 z-[60] -translate-y-[200%] rounded-[12px] bg-fg p-[12px_18px] font-medium text-bg no-underline focus-visible:translate-y-0 max-sm:left-5"
        >
          {nav.skip}
        </a>
        <Nav />
        <main id="main" tabIndex={-1} className="outline-none">
        <Hero />

        <Section id="work">
          <Heading id="work" {...sections.work} more={{ label: sections.work.more, href: links.allProjects }} mb="mb-10" />
          <div className="grid grid-cols-2 gap-7 max-md:grid-cols-1 max-md:gap-5">
            {projects.map((p, i) => (
              <ProjectCard key={i} p={p} i={i} />
            ))}
          </div>
        </Section>

        <Section id="experience">
          <Heading id="experience" {...sections.experience} mb="mb-8" />
          {jobs.map((j, i) => (
            <div
              key={i}
              data-reveal=""
              className="row grid grid-cols-[200px_minmax(0,1fr)_160px] gap-6 border-b border-line p-[28px_0] max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-4 max-md:gap-y-[10px] max-md:p-[24px_0]"
            >
              <span className="pt-[6px] font-mono text-[13px] text-muted max-md:pt-0">{j.when}</span>
              <div className="max-md:order-last max-md:col-span-2">
                <h3 className="m-0 text-[22px] font-normal tracking-[-0.015em] max-sm:text-[20px]"><span className="ul">{j.role}</span></h3>
                <ul className="job-points">
                  {j.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
              <span className="pt-[6px] text-right text-[15px] text-muted max-md:pt-0 max-md:text-[14px]">{j.org}</span>
            </div>
          ))}
        </Section>

        <Section id="wins">
          <Heading id="wins" {...sections.wins} mb="mb-8" />
          <div className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-1 max-[900px]:gap-4">
            {wins.map((w, i) =>
              w.image ? (
                // A win with a screenshot gets the full width: the story on the left, a small shot on the right.
                // Under 900px the shot drops below the story, on the same soft panel.
                <article key={i} data-reveal="" className="win-feature col-span-full overflow-hidden rounded-[16px] border border-line bg-card">
                  <div className="grid grid-cols-[minmax(0,1fr)_400px] max-[900px]:grid-cols-1">
                    <div className="flex flex-col p-8 max-sm:p-6">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="m-0 text-[44px] font-medium tracking-[-0.04em] text-accent max-sm:text-[38px]">{w.place}</p>
                        <span className="font-mono text-[12px] text-muted">{w.year}</span>
                      </div>
                      <h3 className="m-[14px_0_0] text-[19px] font-normal">{w.event}</h3>
                      <div className="mt-5 border-t border-line pt-5">
                        {w.project && <p className="m-0 text-[21px] font-medium tracking-[-0.02em]">{w.project}</p>}
                        <p className="m-[6px_0_0] text-[15px] leading-[1.55] text-muted">{w.what}</p>
                        {w.stack.length > 0 && (
                          <div className="mt-[14px] flex flex-wrap gap-[6px]">
                            {w.stack.map((tag) => (
                              <span key={tag} className="rounded-[6px] bg-soft p-[5px_9px] text-[12px]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-[16px] flex gap-[18px] text-[14px] font-medium">
                          {w.live && (
                            <a href={w.live.href} {...external(w.live.href)} className="link text-accent">
                              {w.live.label}
                            </a>
                          )}
                          {w.code && (
                            <a href={w.code.href} {...external(w.code.href)} className="link">
                              {w.code.label}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <a
                      href={w.live?.href ?? w.image}
                      {...external(w.live?.href ?? "")}
                      aria-label={`${w.project ?? w.event}: open the live demo`}
                      className="win-shot flex items-center bg-soft p-7 max-[900px]:border-t max-[900px]:border-line max-sm:p-5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={w.image} alt={w.alt} width={1440} height={900} loading="lazy" decoding="async" className="block h-auto w-full rounded-[10px]" />
                    </a>
                  </div>
                </article>
              ) : (
                <div key={i} data-reveal="" className="rounded-[16px] border border-line bg-card p-7 max-sm:p-6">
                  <p className="m-0 text-[44px] font-medium tracking-[-0.04em] text-accent max-sm:text-[38px]">{w.place}</p>
                  <h3 className="m-[16px_0_0] text-[19px] font-normal">{w.event}</h3>
                  <p className="m-[6px_0_0] text-[14px] leading-[1.5] text-muted">{w.what}</p>
                  <p className="m-[16px_0_0] font-mono text-[12px] text-muted">{w.year}</p>
                </div>
              )
            )}
          </div>
        </Section>

        <Section id="words">
          <Heading id="words" {...sections.words} mb="mb-8" />
          <div className="grid grid-cols-2 gap-10 max-md:grid-cols-1 max-md:gap-9">
            {quotes.map((q, i) => (
              <figure key={i} data-reveal="" className="m-0">
                <blockquote className="m-0 font-serif text-[30px] leading-[1.35] italic max-sm:text-[24px]">{q.quote}</blockquote>
                <figcaption className="mt-[18px] text-[14px] text-muted">{q.by}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section id="toolkit">
          <Heading id="toolkit" {...sections.toolkit} mb="mb-8" />
          <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1 max-md:gap-4">
            {toolAreas.map((a) => {
              const groups = tools.filter((g) => g.area === a.id);
              const count = groups.reduce((n, g) => n + g.items.length, 0);
              return (
                <div key={a.id} data-reveal="" className="flex flex-col rounded-[16px] border border-line bg-card p-8 max-sm:p-6">
                  <div className="mb-6 flex items-baseline justify-between gap-4">
                    <h3 className="m-0 text-[24px] font-normal tracking-[-0.02em] max-sm:text-[22px]">
                      {a.title}
                      <span className="text-accent">;</span>
                    </h3>
                    <span className="font-mono text-[12px] text-muted">{String(count).padStart(2, "0")} tools</span>
                  </div>
                  {groups.map((g) => (
                    <div key={g.title} className="tool-group">
                      <h4 className="m-[0_0_12px] font-mono text-[11.5px] font-normal tracking-[0.06em] text-muted uppercase">{g.title}</h4>
                      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                        {g.items.map((x) => (
                          <li key={x} className="tool-chip">
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="approach">
          <Heading id="approach" {...sections.approach} mb="mb-10" />
          <div className="grid grid-cols-3 gap-10 max-md:grid-cols-1 max-md:gap-8">
            {principles.map((x) => (
              <div key={x.title} data-reveal="">
                <h3 className="m-[0_0_12px] text-[26px] font-normal tracking-[-0.02em] max-sm:text-[24px]">{x.title}</h3>
                <p className="m-0 leading-[1.6] text-muted">{x.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="writing">
          <Heading id="writing" {...sections.writing} more={{ label: sections.writing.more, href: links.allPosts }} mb="mb-4" />
          {posts.map((b, i) => (
            <a
              key={i}
              href={b.href}
              {...external(b.href)}
              data-reveal=""
              className="row grid grid-cols-[140px_minmax(0,1fr)_120px_24px] items-baseline gap-6 border-b border-line p-[24px_0] no-underline max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-4 max-md:gap-y-2 max-md:p-[20px_0]"
            >
              <span className="font-mono text-[13px] text-muted">{b.date}</span>
              <h3 className="m-0 text-[22px] font-normal tracking-[-0.015em] max-md:order-last max-md:col-span-2 max-sm:text-[20px]"><span className="ul">{b.title}</span></h3>
              <span className="text-right text-[14px] text-muted">{b.where}</span>
              <span aria-hidden="true" className="arrow text-accent max-md:hidden">
                {/^https?:/.test(b.href) ? "↗" : "→"}
              </span>
            </a>
          ))}
        </Section>

        <section id="about" aria-labelledby="about-title" className={SECTION}>
          <div className="flex flex-wrap gap-10 border-t border-line pt-6 max-sm:gap-6">
            <h2 id="about-title" className="m-0 flex-[0_0_180px] text-[15px] font-medium">
              <Label {...sections.about} />
            </h2>
            {/* Headline and text on the left; the photo (trial) sits on the right,
                level with the headline. Phones: headline, photo (centred), then text
                with the hobby chips centred under it. */}
            <div
              className={
                "flex min-w-0 flex-[1_1_600px] flex-col gap-6 " +
                (features.aboutPhoto
                  ? "sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-12 sm:gap-y-8"
                  : "sm:gap-8")
              }
            >
              <Headline line={sections.about.line} accent={sections.about.accent} className="sm:col-start-1 sm:row-start-1" />
              {features.aboutPhoto && (
                <figure data-reveal="" className="photo m-0 w-[150px] max-sm:self-center sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-[28px] sm:mr-5 sm:w-[200px]">
                  <div className="photo-frame rounded-[14px] border border-line bg-card p-[6px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={about.photo.src}
                      width={about.photo.width}
                      height={about.photo.height}
                      alt={about.photo.alt}
                      loading="lazy"
                      decoding="async"
                      className="block h-auto w-full rounded-[10px]"
                    />
                  </div>
                  <figcaption className="mt-[6px] text-center font-script text-[22px] leading-[1.2] text-muted">
                    {about.photo.caption}
                  </figcaption>
                </figure>
              )}
              <div data-reveal="" className="min-w-0 max-w-[640px] sm:col-start-1 sm:row-start-2">
                <p
                  className={
                    "m-0 tracking-[-0.015em] " +
                    (features.aboutPhoto
                      ? "text-[24px] leading-[1.5] max-sm:text-[20px]"
                      : "text-[28px] leading-[1.45] max-sm:text-[22px]")
                  }
                >
                  {about.body}
                </p>
                <div className="mt-7 flex flex-wrap gap-[10px] max-sm:justify-center">
                  {about.hobbies.map((h) => (
                    <span key={h.label} className="inline-flex items-center gap-[8px] rounded-[999px] border border-line p-[10px_16px]">
                      <HobbyIcon name={h.icon} className="h-[15px] w-[15px] shrink-0 text-accent" />
                      {h.label}
                    </span>
                  ))}
                  <span className="rounded-[999px] bg-soft p-[10px_16px]">
                    {about.punctuation}
                    <b className="text-accent">;</b>
                  </span>
                </div>
                {features.thread && (
                  <p className="m-[24px_0_0] text-[16px] leading-[1.7] text-muted">{about.threadNote}</p>
                )}
              </div>
            </div>
          </div>
        </section>
        </main>

        <footer className="border-t border-line p-[100px_0_64px] max-sm:p-[72px_0_48px]">
          <FooterCta />
          <div
            data-reveal=""
            className="mt-16 grid grid-cols-2 gap-14 max-md:grid-cols-1 max-md:gap-10 max-sm:mt-12"
          >
            <p className="m-0 max-w-[500px] text-[18px] leading-[1.7] text-muted max-sm:text-[17px]">{footer.intro}</p>
            <div>
              <p className="m-[0_0_6px] text-[15px] font-medium">{footer.helpTitle}</p>
              <ol className="m-0 list-none p-0">
                {footer.help.map((h, i) => (
                  <li key={i} className="flex gap-4 border-b border-line p-[16px_0] text-[17px] leading-[1.45]">
                    <span className="pt-[3px] font-mono text-[13px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                    {h}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="mt-16 flex flex-wrap items-end justify-between gap-x-6 gap-y-8 max-sm:mt-12">
            <div>
              <a
                href={links.email}
                data-magnet="6"
                className="mail inline-flex items-baseline gap-[10px] text-[26px] tracking-[-0.02em] no-underline max-sm:text-[22px]"
              >
                <span className="link">{links.emailLabel}</span>
                <span aria-hidden="true" className="mail-arrow inline-block text-[22px] text-accent max-sm:text-[19px]">
                  ↗
                </span>
              </a>
              <div className="mt-[6px] ml-[-6px]">
                <CopyEmail />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-[15px] text-muted">
              {footer.links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="link">
                  {l.label}
                </a>
              ))}
              <AshOSLink className="link">{footer.ashos}</AshOSLink>
              <a {...resumeLink} className="link">
                {footer.resume}
              </a>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
            <p className="m-0 text-[13px] text-muted">
              {footer.signoff}
              <span className="text-accent">;</span>
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <FooterStats />
              <BackToTop />
            </div>
          </div>
        </footer>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd).replace(/</g, "\\u003c") }}
      />
      <AshOSTakeover />
      <Motion />
    </div>
  );
}
