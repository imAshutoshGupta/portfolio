// ashOS reads every piece of personal content from the portfolio's own
// `content.ts`, so the desktop never drifts from the site. Nothing here adds
// new facts; it only reshapes what content.ts already says.
//
// `[bracketed]` strings and "#" hrefs are the site's placeholders. They are
// shown as-is, and placeholder links are treated as "not linked yet".

import {
  about,
  features,
  footer,
  hero,
  jobs,
  links,
  meta,
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

/** True when a string still holds a `[placeholder]`. */
const isPlaceholder = (s?: string | null) => !!s && /\[[^\]]*\]/.test(s);

/** A usable href, or null for "#" / placeholder links. */
function realHref(href?: string | null): string | null {
  if (!href || href === "#" || isPlaceholder(href)) return null;
  return href;
}

const pad = (n: number) => String(n).padStart(2, "0");

const initials = hero.name
  .split(/\s+/)
  .map((w) => w[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

const fact = (label: string) => hero.facts.find((f) => f.label === label)?.value ?? "";

export const person = {
  name: hero.name,
  firstName: hero.name.split(/\s+/)[0],
  initials,
  status: hero.status,
  /** Where: "Mumbai or Bangalore · remote or relocation". */
  availability: hero.statusDetail,
  statusLine: `${hero.status} · ${hero.statusDetail}`,
  /** The site's About photo, while that trial is on (features.aboutPhoto). */
  photo: features.aboutPhoto ? about.photo : null,
  tagline: meta.description,
  lead: hero.lead + hero.leadAccent,
  role: fact("Role"),
  experience: fact("Experience"),
  facts: hero.facts,
  bio: about.body,
  hobbies: about.hobbies.map((h) => h.label),
  /** Hobbies with their icon names, for the About Me chips. */
  hobbyChips: about.hobbies,
  // "Favourite punctuation: ;" — the site renders the semicolon after it.
  punctuation: about.punctuation + ";",
  semiLines: hero.semiLines.filter(Boolean),
  site: meta.url,
  siteHost: meta.url.replace(/^https?:\/\//, ""),
  title: meta.title,
  cta: footer.cta,
  signoff: footer.signoff,
};

/** Ownership line shown in About ashOS and the Welcome guide. */
export const copyright = `© ${new Date().getFullYear()} ${hero.name}. All rights reserved.`;

export const localTime = hero.localTime;

/** Ashutosh's local time + the mood line the hero uses. */
export function localNow(date = new Date()) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: localTime.timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: localTime.timeZone, hour: "numeric", hourCycle: "h23" }).format(date)
  );
  const mood = localTime.moods.find(([h]) => hour < h)?.[1] ?? localTime.moods[localTime.moods.length - 1][1];
  return { time, hour, mood, zone: localTime.suffix };
}

const emailAddress = links.email.replace(/^mailto:/, "");

export const contact = {
  email: realHref(links.email),
  emailAddress,
  emailLabel: links.emailLabel,
  github: realHref(links.github),
  linkedin: realHref(links.linkedin),
  resume: links.resume,
  resumeFile: resumeLink.download,
  site: meta.url,
};

export const sectionTitles = sections;

/** The footer's "open to roles / I can help with" block. */
export const workWithMe = {
  intro: footer.intro,
  title: footer.helpTitle,
  items: footer.help,
};

const isImageSrc = (s: string) => /^(\/|https?:\/\/)/.test(s) && !isPlaceholder(s);

export type Work = {
  id: string;
  num: string;
  name: string;
  kind: string;
  year: string;
  blurb: string;
  stack: string[];
  screenshot: string;
  screenshotSrc: string | null;
  /** What the screenshot/demo shows, for screen readers. */
  alt: string;
  live: string | null;
  code: string | null;
  caseStudy: string | null;
  /** False when the project has no case study at all (vs. a "#" placeholder). */
  hasCaseStudy: boolean;
};

export const work: Work[] = projects.map((p, i) => ({
  id: `project-${pad(i + 1)}`,
  num: pad(i + 1),
  name: p.name,
  kind: p.kind,
  year: p.year,
  blurb: p.blurb,
  stack: p.stack,
  screenshot: p.screenshot,
  screenshotSrc: isImageSrc(p.screenshot) ? p.screenshot : null,
  alt: p.alt,
  live: realHref(p.live.href),
  code: realHref(p.code.href),
  caseStudy: p.caseStudy ? realHref(p.caseStudy.href) : null,
  hasCaseStudy: p.caseStudy !== null,
}));

export const experience = jobs.map((j, i) => ({ id: `job-${pad(i + 1)}`, num: pad(i + 1), ...j }));

export const achievements = wins.map((w, i) => ({
  id: `win-${pad(i + 1)}`,
  num: pad(i + 1),
  ...w,
  live: realHref(w.live?.href),
  code: realHref(w.code?.href),
}));

export const writing = posts.map((p, i) => ({ id: `post-${pad(i + 1)}`, num: pad(i + 1), ...p, link: realHref(p.href) }));

export const toolkit = tools;
/** The toolkit split into its areas (AI engineering, Full-stack), as the site shows it. */
export const toolkitAreas = toolAreas.map((a) => ({ ...a, groups: tools.filter((g) => g.area === a.id) }));
export const approach = principles;
export const kindWords = quotes.map((q) => ({ ...q, quote: q.quote.replace(/^"|"$/g, "") }));

export const moreLinks = {
  allProjects: realHref(links.allProjects),
  allPosts: realHref(links.allPosts),
};

export const nowPlaying = { ...hero.nowPlaying, href: realHref(hero.nowPlaying.href) };
