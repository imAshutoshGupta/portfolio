// All site copy lives here. Anything in [square brackets] is placeholder
// content from the v4 design — replace it when the real copy is ready.
// "#" hrefs are placeholders too.

export const features = {
  // The scroll-drawn "thread" in the left gutter (components/site/Thread.tsx),
  // scrubbed by ScrollTrigger. Set to false to remove it (and its About note).
  thread: true,
  // Small framed photo in "Beyond work" (kept). Set to false to remove it.
  aboutPhoto: true,
};

export const meta = {
  title: "Ashutosh Gupta — Full-stack & AI Engineer",
  // Search/share description. Kept timeless: no job hunt (the hero badge has
  // that) and no wins, so it needn't change when the user's situation does.
  description: "Ashutosh Gupta, full-stack & AI engineer. I build products end to end, and the AI inside them.",
  url: "https://iamashutosh.com",
  // Job title for search engines (JSON-LD Person).
  jobTitle: "Full-stack & AI Engineer",
  // Home town for search engines (JSON-LD Person homeLocation). Not shown on
  // the site: the hero badge already says where the user would work.
  home: { locality: "Mumbai", country: "India", countryCode: "IN" },
  // Sitemap <lastmod> for every page (app/sitemap.ts). Bump it by hand when
  // the content changes (YYYY-MM-DD).
  updated: "2026-11-12",
};

export const links = {
  resume: "/Ashutosh_Gupta_Resume.pdf",
  // Cloudflare Email Routing forwards hello@ to the personal inbox.
  email: "mailto:hello@iamashutosh.com",
  emailLabel: "hello@iamashutosh.com",
  linkedin: "https://www.linkedin.com/in/imashutoshgupta",
  github: "https://github.com/imAshutoshGupta",
  x: "https://x.com/im_AshutoshG",
  // Personal Spotify profile (open.spotify.com/user/…). The now-playing widget
  // always links here, whatever track it shows.
  spotify: "https://open.spotify.com/user/luzxyw9wz3d2felvulp35eqqo",
  allProjects: "#",
  allPosts: "https://www.linkedin.com/in/imashutoshgupta/recent-activity/all/",
  ashos: "/desktop",
};

// Every résumé link on the site spreads these attributes.
export const resumeLink = {
  href: links.resume,
  download: links.resume.slice(1), // file name = URL name, so every save path gets it
  target: "_blank",
  rel: "noopener",
};

export const nav = {
  name: "Ashutosh Gupta",
  items: [
    { label: "Work", href: "#work" },
    { label: "Experience", href: "#experience" },
    { label: "Writing", href: "#writing" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],
  ashos: "ashOS ↗",
  resume: "Résumé ↓",
  lightsOn: "Turn lights on",
  lightsOff: "Turn lights off",
  lightsToggle: "Toggle the lights",
  menuOpen: "Open menu",
  menuClose: "Close menu",
  skip: "Skip to content",
};

export const hero = {
  // Availability badge: a short headline, then the details (role · where).
  status: "Open to full-stack & AI engineering roles",
  statusDetail: "Mumbai or Bangalore · remote or relocation",
  name: "Ashutosh Gupta",
  pokeLabel: "Poke Semi, the semicolon",
  // Shown in Semi's speech slot before the first poke.
  semiHint: "this semicolon is alive",
  // What Semi says on each poke (index = number of pokes; the last one sticks).
  semiLines: [
    "",
    "hi, I’m Semi.",
    "a full stop? never.",
    "still here;",
    "a comma, but braver.",
    "not a wink. mostly.",
    "optional? says who.",
    "compilers miss me.",
    "don’t tell the em dash.",
    "the full stop says hi.",
    "I live mid-thought.",
    "still poking? respect.",
    "fine. one more.",
    "okay, back to work.",
  ],
  lead: "I build products end to end, ",
  leadAccent: "and the AI inside them.",
  primaryCta: { label: "See selected work", href: "#work" },
  secondaryCta: { label: "Download résumé" },
  terminalCta: "prefer a terminal? launch ashOS →",
  facts: [
    { label: "Role", value: "Full-stack · AI engineer" },
    { label: "Experience", value: "2 years in production" },
  ],
  localTime: {
    label: "Local time",
    timeZone: "Asia/Kolkata",
    suffix: "IST",
    // [hour below which this applies, mood]
    moods: [
      [6, "probably shipping"],
      [12, "coffee, then code"],
      [18, "deep in the work"],
      [24, "extra-hours mode"],
    ] as [number, string][],
  },
  nowPlaying: {
    label: "Now playing",
    lastPlayedLabel: "Last played",
    // Shown when the API has no track (no scrobbles, or Last.fm is down).
    fallback: "Silence, for now;",
    href: links.spotify,
  },
};

// Optional `line` + `accent`: a one-line headline under the section label
// (the accent half is set in the italic serif, like the hero).
export const sections = {
  work: { num: "01", title: "Selected work", more: "All projects →" },
  experience: { num: "02", title: "Experience" },
  wins: { num: "03", title: "Hackathons & wins" },
  words: { num: "04", title: "Kind words" },
  toolkit: { num: "05", title: "Toolkit" },
  approach: { num: "06", title: "How I work" },
  writing: { num: "07", title: "Writing", more: "More on LinkedIn ↗", line: "Thinking out loud, ", accent: "mostly on LinkedIn." },
  about: { num: "08", title: "Beyond work", line: "The person ", accent: "behind the semicolon." },
};

type ProjectInput = {
  name: string;
  kind: string;
  year: string;
  blurb?: string;
  stack?: string[];
  liveHref?: string;
  codeHref?: string;
  /** Write-up page. Leave out on a real project to hide the link. */
  caseStudyHref?: string;
  /** 16:10 image path in public/ (e.g. "/projects/x.webp"). */
  screenshot?: string;
  /**
   * Looping demo video, 16:10. "/projects/x" means x.mp4 exists, plus x.webp
   * (its first frame, used as the poster and as the screenshot).
   */
  demo?: string;
  /** What the screenshot/demo shows, for screen readers. */
  alt?: string;
};

// Fields a project leaves out fall back to the placeholders below.
export const projects = ([
  { name: "[Project one]", kind: "AI product", year: "[2026]", caseStudyHref: "#" },
  {
    name: "GlyphX",
    kind: "React library",
    year: "2026",
    blurb: "A fast, accessible ⌘K command palette for React, with fuzzy search, light and dark themes, and full TypeScript support.",
    stack: ["React", "TypeScript", "Radix UI", "Zustand"],
    liveHref: "https://imashutoshgupta.github.io/glyphx/",
    codeHref: "https://github.com/imAshutoshGupta/glyphx",
    demo: "/projects/glyphx",
    alt: "GlyphX demo: typing “dark” into the command palette narrows it to the theme commands and the matching docs page.",
  },
  {
    name: "Smudge",
    kind: "Chrome extension",
    year: "2026",
    blurb: "A Chrome extension that blurs personal details before you share your screen.",
    stack: ["JavaScript", "Manifest V3", "Local-first"],
    liveHref: "https://imashutoshgupta.github.io/smudge/",
    codeHref: "https://github.com/imAshutoshGupta/smudge",
    demo: "/projects/smudge",
    alt: "Smudge demo: a customer record with a name, email, phone, card and ID numbers, which Smudge blurs with one click.",
  },
  { name: "[Project four]", kind: "Tool", year: "[2024]", caseStudyHref: "#" },
] satisfies ProjectInput[]).map((p: ProjectInput) => ({
  name: p.name,
  kind: p.kind,
  year: p.year,
  screenshot: p.screenshot ?? (p.demo ? `${p.demo}.webp` : "[Screenshot]"),
  demo: p.demo ? { video: `${p.demo}.mp4`, poster: `${p.demo}.webp` } : null,
  alt: p.alt ?? `${p.name} preview`,
  blurb: p.blurb ?? "[One or two lines: the problem and what you built.]",
  stack: p.stack ?? ["[Stack]", "[Stack]"],
  live: { label: "Live ↗", href: p.liveHref ?? "#" },
  code: { label: "Code ↗", href: p.codeHref ?? "#" },
  caseStudy: p.caseStudyHref ? { label: "Case study →", href: p.caseStudyHref } : null,
}));

export const jobs = [
  {
    when: "2025 — Now",
    role: "Software Developer",
    org: "Newel Technologies",
    points: [
      "Built full-stack fintech apps for wealth-management firms: invoicing, compliance and tracking.",
      "Migrated legacy .NET apps to one Next.js/Nest.js TypeScript stack, cutting feature delivery time by 40%.",
      "Shipped features across 8+ client projects end to end, from UI and APIs to production.",
      "Built reconciliation products that turn AWS S3 file uploads into instant results.",
    ],
  },
];

type WinInput = {
  place: string;
  event: string;
  year: string;
  what: string;
  /** The project built there. With `image` set, the win shows as a wide feature card. */
  project?: string;
  /** How it works, in a few short steps (shown as a numbered strip). */
  steps?: { label: string; text: string }[];
  stack?: string[];
  liveHref?: string;
  codeHref?: string;
  /** 16:10 screenshot in public/ (e.g. "/wins/x.webp"). */
  image?: string;
  alt?: string;
};

export const wins = ([
  {
    place: "Winner",
    event: "Paytm Build for India AI Hackathon",
    year: "Mumbai · 2026",
    project: "RootCause AI",
    what: "An AI teammate that catches UPI payment failures before customers complain, fixes them with human approval, and proves the fix worked.",
    steps: [
      { label: "Detect", text: "Spots a failure spike and investigates the root cause." },
      { label: "Explain", text: "Alerts affected customers in their own language and answers Hindi voice notes." },
      { label: "Fix", text: "Drafts the ops ticket and customer alert. Nothing goes out without approval." },
      { label: "Verify", text: "Confirms recovery, closes the incident and writes the post-mortem." },
    ],
    stack: ["Next.js", "TypeScript", "AI SDK", "Prisma", "Supabase", "Sarvam"],
    liveHref: "https://rootcause-ai-paytm.vercel.app",
    codeHref: "https://github.com/krishna2474/rootcause-ai",
    image: "/wins/rootcause.webp",
    alt: "RootCause AI demo: the ops console shows an HDFC Bank UPI failure spike with its root cause and a customer alert waiting for approval, next to the customer's Paytm app.",
  },
] satisfies WinInput[]).map((w: WinInput) => ({
  place: w.place,
  event: w.event,
  year: w.year,
  what: w.what,
  project: w.project ?? null,
  steps: w.steps ?? [],
  stack: w.stack ?? [],
  live: w.liveHref ? { label: "Live ↗", href: w.liveHref } : null,
  code: w.codeHref ? { label: "Code ↗", href: w.codeHref } : null,
  image: w.image ?? null,
  alt: w.alt ?? `${w.project ?? w.event} preview`,
}));

// Writing: mostly LinkedIn posts. `where` shows in the right-hand column.
// Paste each post's URL as href; an http(s) link opens in a new tab.
export const posts = [
  { date: "[Mon 2026]", title: "[Post title]", where: "LinkedIn", href: "#" },
  { date: "[Mon 2026]", title: "[Post title]", where: "LinkedIn", href: "#" },
  { date: "[Mon 2025]", title: "[Post title]", where: "LinkedIn", href: "#" },
];

// Toolkit: two areas, each split into the résumé's skill groups.
export const toolAreas = [
  { id: "ai", title: "AI engineering" },
  { id: "build", title: "Full-stack" },
] as const;

export const tools: { area: (typeof toolAreas)[number]["id"]; title: string; items: string[] }[] = [
  { area: "ai", title: "Models & prompting", items: ["OpenAI API", "Claude API", "Gemini", "Ollama", "Prompt engineering", "Context engineering"] },
  { area: "ai", title: "Agents & RAG", items: ["LangChain", "LangGraph", "MCP", "Tool calling", "RAG", "Embeddings", "pgvector"] },
  { area: "ai", title: "Evals & observability", items: ["LLM evals", "LangSmith", "RAGAS"] },
  { area: "build", title: "Languages", items: ["Python", "TypeScript", "JavaScript", "SQL"] },
  { area: "build", title: "Frameworks", items: ["FastAPI", "Next.js", "Nest.js", "Node.js", "React.js"] },
  { area: "build", title: "Data & cloud", items: ["PostgreSQL", "MongoDB", "AWS", "Docker", "Git"] },
];

export const principles = [
  { title: "Clarity over cleverness", body: "If a user needs a manual, the design isn't finished. I start from the problem, not the stack." },
  { title: "AI with a reason", body: "I add AI where it saves real time or removes real friction, and I measure that it does." },
  { title: "Finish the last 10%", body: "Edge cases, empty states, the bug at 1 am. That last stretch is where quality lives." },
];

export const quotes = [
  { quote: "\"[A real line from a manager about how you work.]\"", by: "[Name] · [Role], [Company]" },
  { quote: "\"[A real line from a teammate or client.]\"", by: "[Name] · [Role], [Company]" },
];

export const about = {
  body: "I'm a full-stack developer who moved into AI engineering. I like software that feels calm to use and holds up in production, and I don't leave things half done.",
  // icon: a small line icon drawn before the label (components/HobbyIcon.tsx)
  hobbies: [
    { label: "Music, always on", icon: "headphones" },
    { label: "Netflix: “just one more episode”", icon: "tv" },
    { label: "Gym: results still loading", icon: "dumbbell" },
  ] as { label: string; icon: "headphones" | "tv" | "dumbbell" }[],
  punctuation: "Favourite punctuation: ",
  // Shown while features.aboutPhoto is on. 480×600 file, shown small.
  photo: {
    src: "/about/ashutosh.webp",
    width: 480,
    height: 600,
    alt: "Ashutosh in a navy-and-white rugby shirt and glasses, taking a mirror selfie with a Paytm hackathon lanyard.",
    caption: "me, mid-hackathon",
  },
  // Only shown while features.thread is on — it refers to the thread.
  threadNote: "That thin line on the left of this page? It's one long thought. Scroll to the end to see how it finishes.",
};

export const footer = {
  cta: "Have a problem worth the late nights?",
  // Contact block copy (intro + "I can help with" list). Approved for now.
  intro: "I’m open to full-time roles and freelance projects in full-stack and AI engineering. A rough idea, a half-built prototype or a product that needs AI done properly are all good places to start.",
  helpTitle: "I can help with",
  help: [
    "Building a product end to end, from database to UI.",
    "Adding AI that earns its place: LLM features, RAG and agents.",
    "Taking a prototype to production, and finishing the last 10%.",
  ],
  copyEmail: "Copy",
  copiedEmail: "Copied",
  copyEmailLabel: "Copy email address",
  copiedStatus: "Email address copied to clipboard.",
  // Global count of Semi pokes (hero + footer), kept in Cloudflare KV.
  pokes: {
    one: "poke",
    many: "pokes",
    poke: "Poke Semi",
    // Each visitor adds at most this many to the total.
    perVisitor: 20,
    tired: "Semi’s had enough pokes from you",
  },
  views: { one: "view", many: "views" },
  backToTop: "Back to top",
  // Contact rows under the email: "LinkedIn · imashutoshgupta ↗".
  socials: [
    { label: "LinkedIn", handle: "imashutoshgupta", href: links.linkedin },
    { label: "GitHub", handle: "imAshutoshGupta", href: links.github },
    { label: "X", handle: "@im_AshutoshG", href: links.x },
  ],
  // Bottom bar wordmark; the site adds a violet semicolon after it.
  wordmark: "Ashutosh Gupta",
  ashos: "ashOS",
  resume: "Résumé",
  // Sits under the wordmark, which already says who.
  signoff: "Designed and built, mostly after hours",
};

export const ashos = {
  dialogLabel: "ashOS desktop mode",
  status: "ashOS — desktop mode · running",
  exit: "✕ Exit to site",
  frameTitle: "ashOS desktop",
  // /desktop's page title and description (tab, search results, share
  // previews), also server-rendered as a visually hidden heading for crawlers.
  pageTitle: `ashOS — ${hero.name}`,
  pageDescription: `${hero.name}'s portfolio as an interactive desktop.`,
};
