import type { ReactNode } from "react";
import {
  about,
  features,
  footer,
  jobs,
  links,
  posts,
  principles,
  projects,
  quotes,
  resumeLink,
  sections,
  tools,
  wins,
} from "@/content";
import { AshOSLink, AshOSTakeover } from "@/components/site/AshOS";
import FooterCta from "@/components/site/FooterCta";
import Hero from "@/components/site/Hero";
import Nav from "@/components/site/Nav";
import ProjectCard from "@/components/site/ProjectCard";
import Motion from "@/components/site/Motion";

const SECTION = "pb-[120px] max-sm:pb-[88px]";

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

function Heading({ num, title, more, mb }: { num: string; title: string; more?: { label: string; href: string }; mb: string }) {
  const h2 = (
    <h2 className="m-0 text-[15px] font-medium">
      <Label num={num} title={title} />
    </h2>
  );
  return more ? (
    <div className={"flex items-baseline justify-between border-t border-line pt-6 " + mb}>
      {h2}
      <a href={more.href} className="link text-[14px] text-muted">
        {more.label}
      </a>
    </div>
  ) : (
    <div className={"border-t border-line pt-6 " + mb}>{h2}</div>
  );
}

function Section({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section id={id} className={SECTION}>
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
        <Nav />
        <Hero />

        <Section id="work">
          <Heading {...sections.work} more={{ label: sections.work.more, href: links.allProjects }} mb="mb-10" />
          <div className="grid grid-cols-2 gap-7 max-md:grid-cols-1 max-md:gap-5">
            {projects.map((p, i) => (
              <ProjectCard key={i} p={p} i={i} />
            ))}
          </div>
        </Section>

        <Section id="experience">
          <Heading {...sections.experience} mb="mb-8" />
          {jobs.map((j, i) => (
            <div
              key={i}
              data-reveal=""
              className="row grid grid-cols-[200px_minmax(0,1fr)_160px] gap-6 border-b border-line p-[28px_0] max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-4 max-md:gap-y-[10px] max-md:p-[24px_0]"
            >
              <span className="pt-[6px] font-mono text-[13px] text-muted max-md:pt-0">{j.when}</span>
              <div className="max-md:order-last max-md:col-span-2">
                <p className="m-0 text-[22px] tracking-[-0.015em] max-sm:text-[20px]"><span className="ul">{j.role}</span></p>
                <p className="m-[8px_0_0] leading-[1.6] text-muted">{j.what}</p>
              </div>
              <span className="pt-[6px] text-right text-[15px] text-muted max-md:pt-0 max-md:text-[14px]">{j.org}</span>
            </div>
          ))}
        </Section>

        <Section id="words">
          <Heading {...sections.words} mb="mb-8" />
          <div className="grid grid-cols-2 gap-10 max-md:grid-cols-1 max-md:gap-9">
            {quotes.map((q, i) => (
              <figure key={i} data-reveal="" className="m-0">
                <blockquote className="m-0 font-serif text-[30px] leading-[1.35] italic max-sm:text-[24px]">{q.quote}</blockquote>
                <figcaption className="mt-[18px] text-[14px] text-muted">{q.by}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section id="wins">
          <Heading {...sections.wins} mb="mb-8" />
          <div className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-1 max-[900px]:gap-4">
            {wins.map((w, i) => (
              <div key={i} data-reveal="" className="rounded-[16px] border border-line bg-card p-7 max-sm:p-6">
                <p className="m-0 text-[44px] font-medium tracking-[-0.04em] text-accent max-sm:text-[38px]">{w.place}</p>
                <p className="m-[16px_0_0] text-[19px]">{w.event}</p>
                <p className="m-[6px_0_0] text-[14px] leading-[1.5] text-muted">{w.what}</p>
                <p className="m-[16px_0_0] font-mono text-[12px] text-muted">{w.year}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="toolkit">
          <Heading {...sections.toolkit} mb="mb-8" />
          <div className="grid grid-cols-4 gap-6 max-md:grid-cols-2 max-md:gap-y-8">
            {tools.map((g) => (
              <div key={g.title} data-reveal="">
                <p className="m-[0_0_14px] text-[18px]">{g.title}</p>
                <p className="m-0 leading-[1.9] whitespace-pre-line text-muted">{g.items.join("\n")}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="approach">
          <Heading {...sections.approach} mb="mb-10" />
          <div className="grid grid-cols-3 gap-10 max-md:grid-cols-1 max-md:gap-8">
            {principles.map((x) => (
              <div key={x.title} data-reveal="">
                <p className="m-[0_0_12px] text-[26px] tracking-[-0.02em] max-sm:text-[24px]">{x.title}</p>
                <p className="m-0 leading-[1.6] text-muted">{x.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="writing">
          <Heading {...sections.writing} more={{ label: sections.writing.more, href: links.allPosts }} mb="mb-4" />
          {posts.map((b, i) => (
            <a
              key={i}
              href={b.href}
              data-reveal=""
              className="row grid grid-cols-[140px_minmax(0,1fr)_120px_24px] items-baseline gap-6 border-b border-line p-[24px_0] no-underline max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-4 max-md:gap-y-2 max-md:p-[20px_0]"
            >
              <span className="font-mono text-[13px] text-muted">{b.date}</span>
              <span className="text-[22px] tracking-[-0.015em] max-md:order-last max-md:col-span-2 max-sm:text-[20px]"><span className="ul">{b.title}</span></span>
              <span className="text-right text-[14px] text-muted">{b.read}</span>
              <span aria-hidden="true" className="arrow text-accent max-md:hidden">
                →
              </span>
            </a>
          ))}
        </Section>

        <section id="about" className={SECTION}>
          <div className="flex flex-wrap gap-10 border-t border-line pt-6 max-sm:gap-6">
            <h2 className="m-0 flex-[1_1_260px] text-[15px] font-medium">
              <Label {...sections.about} />
            </h2>
            <div data-reveal="" className="flex-[3_1_600px]">
              <p className="m-0 text-[28px] leading-[1.45] tracking-[-0.015em] max-sm:text-[22px]">{about.body}</p>
              <div className="mt-7 flex flex-wrap gap-[10px]">
                {about.hobbies.map((h, i) => (
                  <span key={i} className="rounded-[999px] border border-line p-[10px_16px]">
                    {h}
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
        </section>

        <footer className="border-t border-line p-[100px_0_64px] max-sm:p-[72px_0_48px]">
          <FooterCta />
          <div className="mt-16 flex flex-wrap justify-between gap-4 text-[15px] text-muted max-sm:mt-12">
            <a href={links.email} data-magnet="6" className="link">
              {links.emailLabel}
            </a>
            <div className="flex flex-wrap gap-6">
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
          <p className="m-[48px_0_0] text-[13px] text-muted">
            {footer.signoff}
            <span className="text-accent">;</span>
          </p>
        </footer>
      </div>

      <AshOSTakeover />
      <Motion />
    </div>
  );
}
