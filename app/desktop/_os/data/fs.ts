// The ashOS virtual file system ("Macintosh HD"), built from the portfolio
// content. Pure data + path helpers; no UI.

import { APPS, APP_ORDER, type AppId } from "./apps";
import { docSize, docText, type Doc } from "./doc";
import { SHORTCUTS } from "./shortcuts";
import {
  achievements,
  approach,
  contact,
  copyright,
  experience,
  kindWords,
  localTime,
  moreLinks,
  person,
  sectionTitles as S,
  toolkit,
  work,
  writing,
} from "./portfolio";

export type NodeKind = "volume" | "folder" | "app" | "document" | "image" | "link";

export type FolderGlyph =
  | "generic"
  | "applications"
  | "desktop"
  | "documents"
  | "downloads"
  | "projects"
  | "about"
  | "experience"
  | "education"
  | "skills"
  | "achievements"
  | "writing"
  | "contact"
  | "trash";

export type FsNode = {
  path: string;
  name: string;
  kind: NodeKind;
  parent: string | null;
  children?: string[];
  glyph?: FolderGlyph;
  /** App bundle → that app. Documents → the app that opens them. */
  app?: AppId;
  doc?: Doc;
  ext?: string;
  href?: string | null;
  image?: { src: string | null; title: string; caption?: string; seed: number };
  /** Opens this project in the Projects app (Spotlight). */
  project?: string;
  modified?: string;
  /** One-line description for Get Info and Spotlight. */
  info: string;
  size?: number;
  /** Created by the visitor (New Folder). Can be renamed / trashed. */
  user?: boolean;
  created?: number;
};

export type Fs = Record<string, FsNode>;

export const HOME = "/";
export const TRASH = "/Trash";

/* ---------- path helpers ---------- */

export const join = (dir: string, name: string) => (dir === "/" ? "/" + name : dir + "/" + name);
export const dirname = (p: string) => (p === "/" ? "/" : p.slice(0, p.lastIndexOf("/")) || "/");
export const basename = (p: string) => (p === "/" ? "Macintosh HD" : p.slice(p.lastIndexOf("/") + 1));
export const safeName = (s: string) => s.replace(/\//g, "∕").replace(/\s+/g, " ").trim();

/** Ancestors from the root down to `p` (inclusive). */
export function ancestry(p: string): string[] {
  if (p === "/") return ["/"];
  const parts = p.split("/").filter(Boolean);
  return ["/", ...parts.map((_, i) => "/" + parts.slice(0, i + 1).join("/"))];
}

/** Resolve a shell-style path (absolute, relative, ~, ., ..) case-insensitively. */
export function resolvePath(fs: Fs, cwd: string, input: string): string | null {
  let raw = input.trim();
  if (!raw || raw === "~") return HOME;
  if (raw.startsWith("~/")) raw = raw.slice(1);
  const start = raw.startsWith("/") ? "/" : cwd;
  let cur = start;
  for (const seg of raw.split("/").filter(Boolean)) {
    if (seg === ".") continue;
    if (seg === "..") {
      cur = dirname(cur);
      continue;
    }
    const node = fs[cur];
    if (!node?.children) return null;
    const hit =
      node.children.find((c) => basename(c) === seg) ??
      node.children.find((c) => basename(c).toLowerCase() === seg.toLowerCase());
    if (!hit) return null;
    cur = hit;
  }
  return fs[cur] ? cur : null;
}

export function kindLabel(n: FsNode): string {
  switch (n.kind) {
    case "volume":
      return "Volume";
    case "folder":
      return "Folder";
    case "app":
      return "Application";
    case "image":
      return "PNG image";
    case "link":
      return n.href?.startsWith("mailto:") ? "Email Link" : "Web Location";
    case "document":
      return (
        { pdf: "PDF Document", md: "Markdown Document", txt: "Plain Text", vcf: "vCard" }[n.ext ?? ""] ??
        "Document"
      );
  }
}

export function formatSize(bytes?: number): string {
  if (bytes === undefined) return "--";
  if (bytes < 1000) return `${bytes} bytes`;
  return `${(bytes / 1000).toFixed(bytes < 10_000 ? 1 : 0)} KB`;
}

/** Every descendant of `root` (depth-first, root excluded). */
export function walk(fs: Fs, root = "/"): FsNode[] {
  const out: FsNode[] = [];
  const visit = (p: string) => {
    for (const c of fs[p]?.children ?? []) {
      const n = fs[c];
      if (!n) continue;
      out.push(n);
      if (n.children && n.path !== TRASH) visit(c);
    }
  };
  visit(root);
  return out;
}

/** Name matches first, then content matches. */
export function searchFs(fs: Fs, query: string, root = "/"): FsNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = walk(fs, root);
  const byName = all.filter((n) => n.name.toLowerCase().includes(q));
  const byBody = all.filter(
    (n) => !byName.includes(n) && ((n.doc && docText(n.doc).toLowerCase().includes(q)) || n.info.toLowerCase().includes(q))
  );
  return [...byName, ...byBody];
}

/* ---------- the tree ---------- */

function build(): Fs {
  const fs: Fs = {};

  const add = (parent: string | null, n: Omit<FsNode, "path" | "parent">): string => {
    let name = safeName(n.name);
    if (parent) {
      // Keep sibling names unique (placeholder copy can repeat).
      const base = name;
      for (let i = 2; fs[join(parent, name)]; i++) name = `${base} ${i}`;
    }
    const path = parent === null ? "/" : join(parent, name);
    const node: FsNode = { ...n, name, path, parent };
    if (node.doc && node.size === undefined) node.size = docSize(node.doc);
    fs[path] = node;
    if (parent) fs[parent].children!.push(path);
    return path;
  };
  const folder = (parent: string, name: string, glyph: FolderGlyph, info: string, extra: Partial<FsNode> = {}) =>
    add(parent, { name, kind: "folder", children: [], glyph, info, ...extra });
  const doc = (parent: string, name: string, info: string, d: Doc, extra: Partial<FsNode> = {}) => {
    const ext = name.split(".").pop()!.toLowerCase();
    return add(parent, { name, kind: "document", ext, info, doc: d, ...extra });
  };
  const link = (parent: string, name: string, href: string | null, info: string, extra: Partial<FsNode> = {}) =>
    add(parent, { name: name + ".webloc", kind: "link", ext: "webloc", href, info, ...extra });

  add(null, { name: "Macintosh HD", kind: "volume", children: [], info: "The ashOS startup disk." });

  /* Applications */
  const apps = folder("/", "Applications", "applications", "Every app on ashOS.");
  for (const id of APP_ORDER) {
    const a = APPS[id];
    add(apps, { name: a.bundle, kind: "app", app: id, info: a.description });
  }

  /* Shared documents */
  const overview: Doc = [
    { t: "title", text: person.name, sub: person.title },
    { t: "meta", text: person.status },
    { t: "p", text: person.lead },
    { t: "p", text: person.bio },
    { t: "kv", rows: person.facts.map((f) => [f.label, f.value]) },
    { t: "h", text: S.work.title },
    { t: "list", items: work.map((w) => `${w.name} — ${w.kind}, ${w.year}. ${w.blurb}`) },
    { t: "h", text: S.experience.title },
    { t: "list", items: experience.map((j) => `${j.when}: ${j.role}, ${j.org}. ${j.what}`) },
    { t: "h", text: S.wins.title },
    { t: "list", items: achievements.map((w) => `${w.place} at ${w.event} (${w.year}). ${w.what}`) },
    { t: "h", text: S.toolkit.title },
    { t: "kv", rows: toolkit.map((g) => [g.title, g.items.join(" · ")]) },
    { t: "h", text: S.approach.title },
    { t: "list", items: approach.map((p) => `${p.title}. ${p.body}`) },
    { t: "h", text: S.writing.title },
    { t: "list", items: writing.map((p) => `${p.title} — ${p.date}, ${p.read}`) },
    { t: "h", text: "Contact" },
    {
      t: "links",
      items: [
        { label: "Email", href: contact.email },
        { label: "GitHub", href: contact.github },
        { label: "LinkedIn", href: contact.linkedin },
        { label: "Website", href: contact.site },
      ],
    },
  ];

  const welcome: Doc = [
    { t: "title", text: "Welcome to ashOS", sub: `${person.name}'s portfolio, as a desktop.` },
    {
      t: "p",
      text: "Everything on the portfolio lives here as apps, folders and files. Open Finder to browse it, or press the Spotlight shortcut and type what you're after.",
    },
    { t: "h", text: "Where to start" },
    {
      t: "list",
      items: [
        "About Me: who I am and how I work.",
        "Projects: selected work and hackathon builds.",
        "Finder: the whole portfolio as folders. Try Documents and Projects.",
        "Terminal: the same content from a shell. Type help.",
        "Mail: get in touch.",
      ],
    },
    { t: "h", text: "Keyboard" },
    { t: "keys", rows: SHORTCUTS.map((s) => [s.keys, s.label]) },
    { t: "h", text: "Good to know" },
    {
      t: "list",
      items: [
        "Drag windows by their title bar and resize them from any edge.",
        "Right-click the desktop for more options.",
        "Appearance, wallpaper and the dock live in System Settings.",
        "To go back to the portfolio, open the ; menu and choose Exit to Portfolio.",
      ],
    },
    { t: "hr" },
    {
      t: "meta",
      text: "ashOS is an original design inspired by familiar desktop conventions. It isn't affiliated with Apple.",
    },
    { t: "meta", text: copyright },
  ];

  /* Desktop */
  const desktop = folder("/", "Desktop", "desktop", "Files on the desktop.");
  doc(desktop, "Welcome.pdf", "A short guide to ashOS.", welcome);
  doc(desktop, "Portfolio Overview.pdf", "The whole portfolio on one page.", overview);
  add(desktop, { name: "Resume.pdf", kind: "document", ext: "pdf", app: "resume", info: "Opens the latest résumé." });

  /* Documents */
  const documents = folder("/", "Documents", "documents", "Background, experience and writing.");

  const aboutDir = folder(documents, "About Me", "about", "Profile and approach.");
  doc(aboutDir, "About Me.md", "Profile.", [
    { t: "title", text: person.name, sub: person.role },
    { t: "meta", text: person.status },
    { t: "p", text: person.lead },
    { t: "p", text: person.bio },
    { t: "kv", rows: person.facts.map((f) => [f.label, f.value]) },
  ]);
  doc(aboutDir, "How I Work.md", S.approach.title + ".", [
    { t: "title", text: S.approach.title },
    ...approach.flatMap((p): Doc => [{ t: "h", text: p.title }, { t: "p", text: p.body }]),
  ]);
  doc(aboutDir, "Kind Words.md", S.words.title + ".", [
    { t: "title", text: S.words.title },
    ...kindWords.map((q): Doc[number] => ({ t: "quote", text: q.quote, by: q.by })),
  ]);
  doc(aboutDir, "Beyond Work.md", S.about.title + ".", [
    { t: "title", text: S.about.title },
    { t: "p", text: person.bio },
    { t: "list", items: person.hobbies },
    { t: "meta", text: person.punctuation },
  ]);

  const expDir = folder(documents, "Experience", "experience", S.experience.title + ".");
  for (const j of experience) {
    doc(
      expDir,
      `${j.num} ${j.role} — ${j.org}.md`,
      `${j.role} at ${j.org}, ${j.when}.`,
      [{ t: "title", text: j.role, sub: j.org }, { t: "meta", text: j.when }, { t: "p", text: j.what }],
      { modified: j.when }
    );
  }

  folder(documents, "Education", "education", "No education entries on the portfolio yet.");

  const skillsDir = folder(documents, "Skills", "skills", S.toolkit.title + ".");
  doc(skillsDir, "Toolkit.md", "Everything in the toolkit.", [
    { t: "title", text: S.toolkit.title },
    ...toolkit.flatMap((g): Doc => [{ t: "h", text: g.title }, { t: "list", items: g.items }]),
  ]);
  for (const g of toolkit) {
    doc(skillsDir, `${g.title}.md`, g.items.join(", "), [{ t: "title", text: g.title }, { t: "list", items: g.items }]);
  }

  const winsDir = folder(documents, "Achievements", "achievements", S.wins.title + ".");
  for (const w of achievements) {
    doc(
      winsDir,
      `${w.num} ${w.place} — ${w.event}.md`,
      `${w.place} at ${w.event}, ${w.year}.`,
      [{ t: "title", text: w.event, sub: `${w.place} · ${w.year}` }, { t: "p", text: w.what }],
      { modified: w.year }
    );
  }

  const writingDir = folder(documents, "Writing", "writing", S.writing.title + ".");
  for (const p of writing) {
    link(writingDir, `${p.num} ${p.title}`, p.link, `${p.date} · ${p.read} read`, { modified: p.date });
  }
  if (moreLinks.allPosts) link(writingDir, "All Posts", moreLinks.allPosts, "Every post.");

  const contactDir = folder(documents, "Contact", "contact", "Ways to get in touch.");
  doc(contactDir, `${person.name}.vcf`, "Contact card.", [
    { t: "title", text: person.name, sub: person.role },
    {
      t: "kv",
      rows: [
        ["Email", contact.emailLabel],
        ["GitHub", contact.github ?? "not linked yet"],
        ["LinkedIn", contact.linkedin ?? "not linked yet"],
        ["Website", contact.site],
        ["Time zone", `${localTime.timeZone} (${localTime.suffix})`],
      ],
    },
  ]);
  link(contactDir, "Email", contact.email, contact.emailLabel);
  link(contactDir, "GitHub", contact.github, contact.github ?? "GitHub");
  link(contactDir, "LinkedIn", contact.linkedin, contact.linkedin ?? "LinkedIn");
  link(contactDir, "Portfolio", "/", contact.site);

  /* Projects */
  const projectsDir = folder("/", "Projects", "projects", S.work.title + ".");
  for (const w of work) {
    const dir = folder(projectsDir, `${w.num} ${w.name}`, "generic", `${w.kind}, ${w.year}.`, {
      project: w.id,
      modified: w.year,
    });
    doc(dir, "README.md", w.blurb, [
      { t: "title", text: w.name, sub: `${w.kind} · ${w.year}` },
      { t: "p", text: w.blurb },
      { t: "h", text: "Built with" },
      { t: "chips", items: w.stack },
      { t: "h", text: "Links" },
      {
        t: "links",
        items: [
          { label: "Live demo", href: w.live },
          { label: "Source code", href: w.code },
          ...(w.hasCaseStudy ? [{ label: "Case study", href: w.caseStudy }] : []),
        ],
      },
    ], { project: w.id, modified: w.year });
    add(dir, {
      name: "Screenshot.png",
      kind: "image",
      ext: "png",
      info: `${w.name} screenshot.`,
      image: { src: w.screenshotSrc, title: w.name, caption: w.screenshot, seed: Number(w.num) },
      project: w.id,
    });
    link(dir, "Live Demo", w.live, "Live demo.");
    link(dir, "Source Code", w.code, "Source code.");
    if (w.hasCaseStudy) link(dir, "Case Study", w.caseStudy, "Case study.");
  }
  const extra = folder(projectsDir, "Additional Projects", "generic", "Hackathon builds and more.");
  for (const w of achievements) {
    doc(
      extra,
      `${w.num} ${w.event} build.md`,
      w.what,
      [
        { t: "title", text: w.event, sub: `${w.place} · ${w.year}` },
        { t: "p", text: w.what },
      ],
      { modified: w.year }
    );
  }
  if (moreLinks.allProjects) link(extra, "All Projects", moreLinks.allProjects, "Every project.");

  /* Downloads */
  const downloads = folder("/", "Downloads", "downloads", "Downloaded files.");
  add(downloads, { name: contact.resumeFile, kind: "document", ext: "pdf", app: "resume", info: "The latest résumé." });

  /* Trash */
  const trash = folder("/", "Trash", "trash", "Items you've moved to the Trash.");
  doc(trash, "full stop.txt", "Thrown away, on principle.", [
    { t: "p", text: person.semiLines[1] ?? "a full stop? never." },
    { t: "meta", text: "— Semi" },
  ]);

  return fs;
}

export const BASE_FS: Fs = build();

/* ---------- visitor changes (new folders, trash) ---------- */

export type FsChanges = {
  /** Folders the visitor created: path → node. */
  created: FsNode[];
  /** Base paths the visitor deleted (Empty Trash). */
  removed: string[];
};

export const NO_CHANGES: FsChanges = { created: [], removed: [] };

export function applyChanges(base: Fs, ch: FsChanges): Fs {
  if (!ch.created.length && !ch.removed.length) return base;
  const fs: Fs = { ...base };
  const touch = (p: string) => {
    if (fs[p] && fs[p] === base[p]) fs[p] = { ...fs[p], children: [...(fs[p].children ?? [])] };
  };
  for (const p of ch.removed) {
    const n = fs[p];
    if (!n?.parent) continue;
    touch(n.parent);
    fs[n.parent].children = fs[n.parent].children!.filter((c) => c !== p);
    delete fs[p];
  }
  for (const n of ch.created) {
    if (!n.parent || !fs[n.parent]) continue;
    touch(n.parent);
    fs[n.path] = n;
    fs[n.parent].children!.push(n.path);
  }
  return fs;
}

export function uniqueName(fs: Fs, dir: string, base: string): string {
  let name = base;
  for (let i = 2; fs[join(dir, name)]; i++) name = `${base} ${i}`;
  return name;
}
