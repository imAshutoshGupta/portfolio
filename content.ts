// All site copy lives here. Anything in [square brackets] is placeholder
// content from the v4 design — replace it when the real copy is ready.
// "#" hrefs are placeholders too.

export const features = {
  // The scroll-drawn "thread" in the left gutter (components/site/Thread.tsx),
  // scrubbed by ScrollTrigger. Set to false to remove it (and its About note).
  thread: true,
};

export const meta = {
  title: "Ashutosh Gupta — Full-stack · AI engineer",
  description: "I build products end to end, and the AI inside them.",
  url: "https://ashutoshgupta.dev",
};

export const links = {
  resume: "/resume.pdf",
  email: "mailto:[your@email]",
  emailLabel: "[your@email]",
  linkedin: "https://linkedin.com/in/imAshutoshGupta",
  github: "https://github.com/imAshutoshGupta",
  allProjects: "#",
  allPosts: "#",
  ashos: "/desktop",
};

// Every résumé link on the site spreads these attributes.
export const resumeLink = {
  href: links.resume,
  download: "Ashutosh-Gupta-Resume.pdf",
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
  ],
  ashos: "ashOS ↗",
  resume: "Résumé ↓",
  toggleLabel: "Toggle dark mode",
  menuOpen: "Open menu",
  menuClose: "Close menu",
};

export const hero = {
  status: "Available for new roles",
  name: "Ashutosh Gupta",
  pokeLabel: "Poke Semi, the semicolon",
  // What Semi says on each poke (index = number of pokes; the last one sticks).
  semiLines: ["", "hi, I’m Semi.", "a full stop? never.", "still here;", "okay, back to work."],
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
    fallback: "[Track] — [Artist]",
    href: "#",
  },
};

export const sections = {
  work: { num: "01", title: "Selected work", more: "All projects →" },
  experience: { num: "02", title: "Experience" },
  words: { num: "03", title: "Kind words" },
  wins: { num: "04", title: "Hackathons & wins" },
  toolkit: { num: "05", title: "Toolkit" },
  approach: { num: "06", title: "How I work" },
  writing: { num: "07", title: "Writing", more: "All posts →" },
  about: { num: "08", title: "Beyond work" },
};

export const projects = [
  { name: "[Project one]", kind: "AI product", year: "[2026]" },
  { name: "[Project two]", kind: "Full-stack app", year: "[2025]" },
  { name: "[Project three]", kind: "AI agent", year: "[2025]" },
  { name: "[Project four]", kind: "Tool", year: "[2024]" },
].map((p) => ({
  ...p,
  screenshot: "[Screenshot]",
  blurb: "[One or two lines: the problem and what you built.]",
  stack: ["[Stack]", "[Stack]"],
  live: { label: "Live ↗", href: "#" },
  code: { label: "Code ↗", href: "#" },
  caseStudy: { label: "Case study →", href: "#" },
}));

export const jobs = [
  { when: "[2025] — Now", role: "Software Developer · AI", org: "[Company]", what: "[What you own, the AI features you shipped, and one result.]" },
  { when: "[2024] — [2025]", role: "Software Developer", org: "[Company]", what: "[What you built full-stack, and the impact.]" },
  { when: "[Year]", role: "[Internship / freelance / education]", org: "[Where]", what: "[One line.]" },
];

export const wins = [
  { place: "[1st]", year: "[2025]" },
  { place: "[Top 5]", year: "[2025]" },
  { place: "[Finalist]", year: "[2024]" },
].map((w) => ({
  ...w,
  event: "[Hackathon name]",
  what: "[What you built in 36 hours, in one line]",
}));

export const posts = [
  { date: "[Mon 2026]", read: "[6 min]" },
  { date: "[Mon 2026]", read: "[8 min]" },
  { date: "[Mon 2025]", read: "[5 min]" },
].map((p) => ({ ...p, title: "[Post title]", href: "#" }));

export const tools = [
  { title: "Build", items: ["[Front-end tool]", "[Back-end tool]", "[Database]"] },
  { title: "AI", items: ["LLM applications", "Retrieval (RAG)", "Agents & evals"] },
  { title: "Design", items: ["[Design tool]", "Prototyping", "Design systems"] },
  { title: "Ship", items: ["[Cloud]", "[CI/CD]", "[Monitoring]"] },
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
  hobbies: ["[Hobby one]", "[Hobby two]", "[Hobby three]"],
  punctuation: "Favourite punctuation: ",
  // Only shown while features.thread is on — it refers to the thread.
  threadNote: "That thin line on the left of this page? It's one long thought. Scroll to the end to see how it finishes.",
};

export const footer = {
  cta: "Have a problem worth the late nights?",
  links: [
    { label: "LinkedIn", href: links.linkedin },
    { label: "GitHub", href: links.github },
  ],
  ashos: "ashOS",
  resume: "Résumé",
  signoff: "Designed and built by Ashutosh, mostly after hours",
};

export const ashos = {
  dialogLabel: "ashOS desktop mode",
  status: "ashOS — desktop mode · running",
  exit: "✕ Exit to site",
  frameTitle: "ashOS desktop",
};
