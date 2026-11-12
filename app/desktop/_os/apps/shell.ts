// The ashOS shell: a small zsh-flavoured command interpreter over the virtual
// file system. Pure logic; the Terminal app renders its output and applies
// its side effects.

import { APPS, APP_ORDER, type AppArgs, type AppId } from "../data/apps";
import { docToLines, relabelKeys } from "../data/doc";
import { basename, formatSize, HOME, kindLabel, resolvePath, type Fs, type FsNode } from "../data/fs";
import { achievements, approach, contact, experience, kindWords, localNow, person, toolkitAreas, work, workWithMe, writing } from "../data/portfolio";

type Tone = "accent" | "green" | "blue" | "cyan" | "yellow" | "red" | "magenta" | "muted" | "bold";
type Seg = { t: string; c?: Tone };
export type Line = Seg[];

export type ShellCtx = {
  fs: Fs;
  cwd: string;
  cols: number;
  rows: number;
  appearance: "light" | "dark";
  bootedAt: number;
  history: string[];
  viewport: { w: number; h: number };
  /** Shortcut labels for this platform (⌘/⌥ or Ctrl/Alt). */
  keyLabel?: (s: string) => string;
};

type Effect =
  | { type: "cd"; path: string }
  | { type: "clear" }
  | { type: "open"; path: string }
  | { type: "launch"; app: AppId; args?: AppArgs }
  | { type: "appearance"; value: "light" | "dark" | "auto" }
  | { type: "exit" };

export type Result = { lines: Line[]; effects?: Effect[] };

const s = (t: string, c?: Tone): Seg => ({ t, c });
const plain = (t: string): Line => [s(t)];

const COMMANDS: Record<string, string> = {
  help: "list commands",
  about: "who I am",
  whoami: "the short version",
  ls: "list a folder (-l for details)",
  cd: "change folder",
  pwd: "print the current folder",
  cat: "print a file",
  open: "open a file, folder, app or URL",
  tree: "show a folder tree",
  projects: "selected work",
  experience: "roles and companies",
  skills: "the toolkit",
  approach: "how I work",
  wins: "hackathons and wins",
  words: "kind words",
  writing: "posts",
  contact: "ways to reach me",
  neofetch: "system info",
  theme: "switch appearance (light | dark | auto)",
  date: "print the date",
  echo: "print text",
  history: "previous commands",
  clear: "clear the screen",
  exit: "close this window",
};

/** Split a command line, honouring quotes and backslash-escaped spaces. */
function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q: string | null = null;
  let any = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === q) q = null;
      else cur += ch;
    } else if (ch === "'" || ch === '"') {
      q = ch;
      any = true;
    } else if (ch === "\\" && i + 1 < line.length) {
      cur += line[++i];
      any = true;
    } else if (/\s/.test(ch)) {
      if (cur || any) out.push(cur);
      cur = "";
      any = false;
    } else cur += ch;
  }
  if (cur || any) out.push(cur);
  return out;
}

const tone = (n: FsNode): Tone | undefined =>
  n.children ? "blue" : n.kind === "app" ? "green" : n.kind === "link" ? "cyan" : n.kind === "image" ? "magenta" : undefined;
const display = (n: FsNode) => (n.children ? n.name + "/" : n.name);

export const promptDir = (cwd: string) => (cwd === HOME ? "~" : basename(cwd));

function columns(nodes: FsNode[], width: number): Line[] {
  if (!nodes.length) return [];
  const w = Math.max(...nodes.map((n) => display(n).length)) + 2;
  const per = Math.max(1, Math.floor(width / w));
  const rows = Math.ceil(nodes.length / per);
  const out: Line[] = [];
  for (let r = 0; r < rows; r++) {
    const line: Line = [];
    for (let c = 0; c < per; c++) {
      const n = nodes[c * rows + r];
      if (!n) continue;
      const last = c === per - 1 || !nodes[(c + 1) * rows + r];
      line.push(s(last ? display(n) : display(n).padEnd(w), tone(n)));
    }
    out.push(line);
  }
  return out;
}

function long(nodes: FsNode[]): Line[] {
  return nodes.map((n) => [
    s((n.children ? "drwxr-xr-x" : n.kind === "app" ? "drwxr-xr-x" : "-rw-r--r--") + "  ", "muted"),
    s(`${person.login}  staff  `, "muted"),
    s((n.children ? "--" : formatSize(n.size)).padStart(9) + "  "),
    s((n.modified ?? "").padEnd(14) + "  ", "muted"),
    s(display(n), tone(n)),
  ]);
}

function tree(fs: Fs, root: string, prefix = "", depth = 0, out: Line[] = []): Line[] {
  const kids = (fs[root]?.children ?? []).map((p) => fs[p]).filter(Boolean);
  kids.forEach((n, i) => {
    const last = i === kids.length - 1;
    out.push([s(prefix + (last ? "└── " : "├── "), "muted"), s(n.name, tone(n))]);
    if (n.children && n.kind !== "app" && depth < 3) tree(fs, n.path, prefix + (last ? "    " : "│   "), depth + 1, out);
  });
  return out;
}

const SEMI_ART = [
  "      .d8b.     ",
  "     d88888b    ",
  "     Y88888P    ",
  "      'Y8P'     ",
  "                ",
  "      .d8b.     ",
  "     d88888b    ",
  "     Y888888    ",
  "       'd8P     ",
  "      .d8P'     ",
  "     'P'        ",
];

function uptime(ms: number) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "less than a minute";
  if (m < 60) return `${m} min${m === 1 ? "" : "s"}`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

function neofetch(ctx: ShellCtx): Line[] {
  const rows: [string, string][] = [
    ["OS", "ashOS 7 (web)"],
    ["Host", person.siteHost],
    ["Kernel", "Next.js · React"],
    ["Uptime", uptime(Date.now() - ctx.bootedAt)],
    ["Shell", "ash (zsh-flavoured)"],
    ["Resolution", `${ctx.viewport.w}×${ctx.viewport.h}`],
    ["Appearance", ctx.appearance === "dark" ? "Dark" : "Light"],
    ["Role", person.role],
    ["Experience", person.experience],
    ["Status", person.statusLine],
    ["Local time", `${localNow().time} ${localNow().zone}`],
  ];
  const head: Line[] = [
    [s(person.login, "accent"), s("@"), s("ashOS", "accent")],
    [s("-".repeat(person.login.length + 6), "muted")],
    ...rows.map(([k, v]): Line => [s(k + ": ", "accent"), s(v)]),
    [],
    [
      s("███", "red"),
      s("███", "yellow"),
      s("███", "green"),
      s("███", "cyan"),
      s("███", "blue"),
      s("███", "magenta"),
      s("███", "muted"),
    ],
  ];
  if (ctx.cols < 56) return head;
  const n = Math.max(SEMI_ART.length, head.length);
  return Array.from({ length: n }, (_, i) => [s((SEMI_ART[i] ?? "").padEnd(18), "accent"), ...(head[i] ?? [])]);
}

export function runCommand(input: string, ctx: ShellCtx): Result {
  const tokens = tokenize(input.trim());
  if (!tokens.length) return { lines: [] };
  const [cmd, ...args] = tokens;
  const flags = args.filter((a) => /^-\w+$/.test(a)).join("");
  const rest = args.filter((a) => !/^-\w+$/.test(a));
  const target = rest[0];
  const resolve = (p: string) => resolvePath(ctx.fs, ctx.cwd, p);

  switch (cmd.toLowerCase()) {
    case "help":
    case "?":
    case "man": {
      const w = Math.max(...Object.keys(COMMANDS).map((k) => k.length)) + 3;
      return {
        lines: [
          [s("ashOS shell. ", "bold"), s("Commands:", "muted")],
          ...Object.entries(COMMANDS).map(([k, v]): Line => [s("  " + k.padEnd(w), "accent"), s(v, "muted")]),
          [],
          [s("Tab completes commands and paths. ↑/↓ walk your history.", "muted")],
          [s("Try: ", "muted"), s("cd Projects"), s(" · ", "muted"), s("ls -l"), s(" · ", "muted"), s("open README.md")],
        ],
      };
    }

    case "about":
      return {
        lines: [
          [s(person.name, "bold"), s(" — " + person.role, "muted")],
          [s(person.statusLine, "green")],
          [],
          plain(person.lead),
          [],
          ...docToLines([{ t: "p", text: person.bio }], Math.min(ctx.cols, 90)).map(plain),
          [],
          ...person.facts.map((f): Line => [s(f.label.padEnd(12), "accent"), s(f.value)]),
          [s("Beyond work".padEnd(12), "accent"), s(person.hobbies.join(" · "))],
        ],
      };

    case "whoami":
      return { lines: [[s(person.login, "bold"), s(`  (${person.name} · ${person.role})`, "muted")]] };

    case "pwd":
      return { lines: [plain(ctx.cwd)] };

    case "cd": {
      const path = target ? resolve(target) : HOME;
      if (!path) return { lines: [[s(`cd: no such file or directory: ${target}`, "red")]] };
      if (!ctx.fs[path].children) return { lines: [[s(`cd: not a directory: ${target}`, "red")]] };
      return { lines: [], effects: [{ type: "cd", path }] };
    }

    case "ls":
    case "dir": {
      const path = target ? resolve(target) : ctx.cwd;
      const n = path ? ctx.fs[path] : undefined;
      if (!n) return { lines: [[s(`ls: ${target ?? "."}: No such file or directory`, "red")]] };
      const nodes = n.children ? n.children.map((p) => ctx.fs[p]).filter(Boolean) : [n];
      if (!nodes.length) return { lines: [] };
      if (flags.includes("l")) return { lines: [[s(`total ${nodes.length}`, "muted")], ...long(nodes)] };
      return { lines: columns(nodes, ctx.cols) };
    }

    case "tree": {
      const path = target ? resolve(target) : ctx.cwd;
      if (!path || !ctx.fs[path]?.children) return { lines: [[s(`tree: ${target ?? ""}: not a folder`, "red")]] };
      const lines = tree(ctx.fs, path);
      return { lines: [[s(path === HOME ? "." : ctx.fs[path].name, "blue")], ...lines] };
    }

    case "cat":
    case "less":
    case "more": {
      if (!target) return { lines: [[s("usage: cat <file>", "muted")]] };
      const path = resolve(target);
      if (!path) return { lines: [[s(`cat: ${target}: No such file or directory`, "red")]] };
      const n = ctx.fs[path];
      if (n.children) return { lines: [[s(`cat: ${target}: Is a directory`, "red")]] };
      if (n.kind === "app") return { lines: [[s(`cat: ${n.name}: is an application. Try `, "muted"), s(`open ${n.name.replace(/ /g, "\\ ")}`)]] };
      if (n.kind === "link") return { lines: [[s("URL=", "muted"), s(n.href ?? "(not linked yet)", n.href ? "cyan" : "muted")]] };
      if (n.kind === "image") return { lines: [[s(`${n.name}: ${n.image?.src ? kindLabel(n) : n.image?.caption + " (no image yet)"}`, "muted")]] };
      if (!n.doc) return { lines: [[s(`${n.name} is a PDF. Try `, "muted"), s(`open ${n.name}`)]] };
      const d = ctx.keyLabel ? relabelKeys(n.doc, ctx.keyLabel) : n.doc;
      return { lines: docToLines(d, Math.min(ctx.cols, 90)).map(plain) };
    }

    case "open": {
      if (!target) return { lines: [[s("usage: open <file | folder | app | url>", "muted")]] };
      const appFlag = args.indexOf("-a");
      const name = (appFlag >= 0 ? args.slice(appFlag + 1) : rest).join(" ").replace(/\.app$/i, "").toLowerCase();
      // Only real URLs go to Safari; a mistyped path is a missing file.
      if (/^https?:\/\//i.test(target)) {
        return { lines: [], effects: [{ type: "launch", app: "safari", args: { url: target } }] };
      }
      const app = APP_ORDER.find((id) => APPS[id].name.toLowerCase() === name || id === name);
      if (app && (appFlag >= 0 || !resolve(target))) return { lines: [], effects: [{ type: "launch", app }] };
      const path = resolve(target);
      if (!path) {
        const full = target.startsWith("/") ? target : target.startsWith("~/") ? target.slice(1) : `${ctx.cwd === "/" ? "" : ctx.cwd}/${target}`;
        return { lines: [[s(`The file ${full} does not exist.`, "red")]] };
      }
      return { lines: [], effects: [{ type: "open", path }] };
    }

    case "projects":
      return {
        lines: [
          ...work.flatMap((w): Line[] => [
            [s(w.num + "  ", "muted"), s(w.name, "bold"), s(`  ${w.kind} · ${w.year}`, "muted")],
            [s("    " + w.blurb)],
            [s("    " + w.stack.join(" · "), "accent")],
          ]),
          [],
          [s("Browse them: ", "muted"), s("cd ~/Projects"), s(" or ", "muted"), s("open -a Projects")],
        ],
      };

    case "experience":
    case "work":
      return {
        lines: experience.flatMap((j): Line[] => [
          [s(j.when.padEnd(18), "accent"), s(j.role, "bold"), s(" · " + j.org, "muted")],
          ...j.points.map((p): Line => [s(" ".repeat(18) + "– " + p)]),
        ]),
      };

    case "skills":
    case "toolkit":
      return {
        lines: toolkitAreas.flatMap((a): Line[] => [
          [s(a.title + ";", "bold")],
          ...a.groups.map((g): Line => [s("  " + g.title.padEnd(24), "accent"), s(g.items.join(" · "))]),
        ]),
      };

    case "wins":
    case "achievements":
      return {
        lines: achievements.flatMap((w): Line[] => [
          [s(w.place.padEnd(12), "yellow"), s(w.event, "bold"), s(` (${w.year})`, "muted")],
          [s(" ".repeat(12) + (w.project ? `${w.project}: ` : "") + w.what)],
          ...(w.live ? [[s(" ".repeat(12) + "live  " + w.live, "muted")] as Line] : []),
          ...(w.code ? [[s(" ".repeat(12) + "code  " + w.code, "muted")] as Line] : []),
        ]),
      };

    case "words":
      return {
        lines: kindWords.flatMap((q, i): Line[] => [...(i ? [[] as Line] : []), [s(`“${q.quote}”`)], [s("  — " + q.by, "muted")]]),
      };

    case "writing":
    case "posts":
      return { lines: writing.map((p): Line => [s(p.date.padEnd(12), "muted"), s(p.title), s(`  on ${p.where}`, "muted")]) };

    case "approach":
      return { lines: approach.flatMap((p): Line[] => [[s(p.title, "bold")], [s("  " + p.body, "muted")]]) };

    case "contact":
      return {
        lines: [
          [s("email     ", "accent"), s(contact.emailLabel)],
          [s("github    ", "accent"), s(contact.github ?? "not linked yet", contact.github ? "cyan" : "muted")],
          [s("linkedin  ", "accent"), s(contact.linkedin ?? "not linked yet", contact.linkedin ? "cyan" : "muted")],
          [s("x         ", "accent"), s(contact.x ?? "not linked yet", contact.x ? "cyan" : "muted")],
          [s("web       ", "accent"), s(contact.site, "cyan")],
          [],
          [s(workWithMe.title, "bold")],
          ...workWithMe.items.map((h, i): Line => [s(`  ${String(i + 1).padStart(2, "0")}  `, "accent"), s(h)]),
          [],
          [s("Write a message: ", "muted"), s("open -a Mail")],
        ],
      };

    case "neofetch":
    case "fastfetch":
      return { lines: neofetch(ctx) };

    case "theme":
    case "appearance": {
      // No argument toggles; anything but light, dark or auto is an error.
      const want = target?.toLowerCase();
      if (want && want !== "light" && want !== "dark" && want !== "auto") {
        return { lines: [[s(`${cmd}: unknown appearance: ${target}`, "red")], [s("usage: theme [light | dark | auto]", "muted")]] };
      }
      const v = want === "light" || want === "dark" || want === "auto" ? want : ctx.appearance === "dark" ? "light" : "dark";
      return { lines: [[s(`appearance: ${v}`, "muted")]], effects: [{ type: "appearance", value: v }] };
    }

    case "date":
      return { lines: [plain(new Date().toString().replace(/\s\(.*\)$/, ""))] };

    case "echo":
      return { lines: [plain(args.join(" "))] };

    case "history":
      return { lines: ctx.history.map((h, i): Line => [s(String(i + 1).padStart(4) + "  ", "muted"), s(h)]) };

    case "clear":
    case "cls":
      return { lines: [], effects: [{ type: "clear" }] };

    case "exit":
    case "logout":
      return { lines: [[s("[Process completed]", "muted")]], effects: [{ type: "exit" }] };

    case "sudo":
      if (args.join("").replace(/[-\s]/g, "").toLowerCase() === "hireme")
        return {
          lines: [[s("✓ ", "green"), s("permission granted. ", "muted"), s(contact.emailLabel, "bold")]],
          effects: [{ type: "launch", app: "mail", args: { compose: true } }],
        };
      return { lines: [[s(`${person.login} is not in the sudoers file. Try `, "muted"), s("sudo hire-me")]] };

    case "rm":
    case "mv":
    case "touch":
    case "mkdir":
      return { lines: [[s(`${cmd}: read-only file system. Use Finder to make folders.`, "muted")]] };

    default:
      return { lines: [[s(`zsh: command not found: ${cmd}`, "red")], [s("Type ", "muted"), s("help", "accent"), s(" for a list.", "muted")]] };
  }
}

/** Tab completion for commands (first word) and paths (everything else). */
export function complete(line: string, ctx: ShellCtx): { line: string; options?: string[] } {
  const m = /^(.*?)((?:\\ |[^\s])*)$/.exec(line);
  const before = m?.[1] ?? "";
  const word = (m?.[2] ?? "").replace(/\\ /g, " ");
  if (!before.trim()) {
    const hits = Object.keys(COMMANDS).filter((c) => c.startsWith(word.toLowerCase()));
    if (hits.length === 1) return { line: hits[0] + " " };
    return { line, options: hits.length > 1 ? hits : undefined };
  }
  const slash = word.lastIndexOf("/");
  const dirPart = slash >= 0 ? word.slice(0, slash + 1) : "";
  const prefix = (slash >= 0 ? word.slice(slash + 1) : word).toLowerCase();
  const dir = resolvePath(ctx.fs, ctx.cwd, dirPart || ".");
  const kids = dir ? (ctx.fs[dir].children ?? []).map((p) => ctx.fs[p]).filter(Boolean) : [];
  const hits = kids.filter((n) => n.name.toLowerCase().startsWith(prefix));
  if (!hits.length) return { line };
  const esc = (t: string) => t.replace(/ /g, "\\ ");
  if (hits.length === 1) {
    const n = hits[0];
    return { line: before + esc(dirPart + n.name) + (n.children ? "/" : " ") };
  }
  // Extend to the longest common prefix.
  let common = hits[0].name;
  for (const h of hits) while (!h.name.toLowerCase().startsWith(common.toLowerCase())) common = common.slice(0, -1);
  const extended = common.length > prefix.length ? before + esc(dirPart + common) : line;
  return { line: extended, options: hits.map((h) => display(h)) };
}
