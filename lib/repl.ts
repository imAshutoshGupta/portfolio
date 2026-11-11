// Shared terminal command engine. Pure logic — no DOM — so the same REPL powers
// both the hero terminal on the home page and the Terminal app inside ashOS.

import { PROJECTS } from "./data";

export type SegColor = "gold" | "green" | "fg" | "muted" | "faint";
export type Seg = { t: string; c?: SegColor };
export type Row = Seg[];

export type ReplAction =
  | { type: "openOS" }
  | { type: "theme"; value?: "dark" | "light" }
  | { type: "nav"; href: string; external?: boolean }
  | { type: "clear" };

export type ReplResult = { rows: Row[]; action?: ReplAction };

const g = (t: string): Seg => ({ t, c: "gold" });
const m = (t: string): Seg => ({ t, c: "muted" });
const f = (t: string): Seg => ({ t, c: "fg" });
const gr = (t: string): Seg => ({ t, c: "green" });

const COMMANDS = [
  "help",
  "whoami",
  "ls",
  "cat",
  "open",
  "skills",
  "experience",
  "contact",
  "theme",
  "clear",
  "sudo",
] as const;

function helpRows(): Row[] {
  const cmd = (name: string, desc: string): Row => [g(name.padEnd(16)), m(desc)];
  return [
    [m("available commands:")],
    cmd("whoami", "who is Ashutosh"),
    cmd("ls [projects]", "list selected work"),
    cmd("cat <name>", "read a project, stack.json, or about"),
    cmd("open <name>", "open a project / github / linkedin / resume / ashos"),
    cmd("skills", "the toolkit"),
    cmd("experience", "the git log"),
    cmd("contact", "say hello"),
    cmd("theme [dark|light]", "flip the lights"),
    cmd("clear", "clear the screen"),
    [m("tip: "), f("⌘K"), m(" opens the command palette anywhere.")],
  ];
}

export function runCommand(raw: string): ReplResult {
  const input = raw.trim();
  if (!input) return { rows: [] };
  const [cmd, ...rest] = input.split(/\s+/);
  const arg = rest.join(" ").toLowerCase();

  switch (cmd.toLowerCase()) {
    case "help":
    case "?":
      return { rows: helpRows() };

    case "whoami":
      return {
        rows: [[f("Ashutosh Gupta"), m(" — full-stack engineer ✦ SF")], [m("6 years shipping software at scale.")]],
      };

    case "ls":
      return {
        rows: PROJECTS.map((p) => [g(p.name.toLowerCase().padEnd(10)), m(p.blurb)]),
      };

    case "cat": {
      if (arg === "stack.json" || arg === "stack") {
        return {
          rows: [
            [m("{ "), gr('"role"'), m(": "), f('"full-stack"'), m(",")],
            [m("  "), gr('"years"'), m(": "), f("6"), m(", "), gr('"scale"'), m(": "), f('"40M req/day"'), m(" }")],
          ],
        };
      }
      if (arg === "about" || arg === "about.md") {
        return {
          rows: [
            [m("I design and engineer products end-to-end —")],
            [m("from Postgres schema to the last pixel.")],
          ],
        };
      }
      const p = PROJECTS.find((x) => x.slug === arg || x.name.toLowerCase() === arg);
      if (p) {
        return {
          rows: [
            [f(p.name), m("  "), g(p.stars)],
            [m(p.blurb)],
            [m("stack: "), f(p.stack.join(" · "))],
            [m("→ open " + p.slug + " for the case study")],
          ],
        };
      }
      return { rows: [[m("cat: "), f(arg || "?"), m(": no such file")]] };
    }

    case "open": {
      if (arg === "ashos" || arg === "desktop") return { rows: [[m("booting ashOS…")]], action: { type: "openOS" } };
      if (arg === "github") return { rows: [[m("→ github.com/imAshutoshGupta")]], action: { type: "nav", href: "https://github.com/imAshutoshGupta", external: true } };
      if (arg === "linkedin") return { rows: [[m("→ linkedin.com/in/imAshutoshGupta")]], action: { type: "nav", href: "https://linkedin.com/in/imAshutoshGupta", external: true } };
      if (arg === "resume" || arg === "resume.pdf") return { rows: [[m("→ resume.pdf")]], action: { type: "nav", href: "/resume.pdf", external: true } };
      const p = PROJECTS.find((x) => x.slug === arg || x.name.toLowerCase() === arg);
      // case-study pages were removed with the old home page; point at the work section
      if (p) return { rows: [[m("→ /#work")]], action: { type: "nav", href: "/#work" } };
      return { rows: [[m("open: don't know how to open "), f(arg || "that")]] };
    }

    case "skills":
      return {
        rows: [
          [g("languages "), m("TypeScript · Python · Go")],
          [g("frontend  "), m("Next.js · React · Tailwind")],
          [g("backend   "), m("Node.js · NestJS · GraphQL · tRPC")],
          [g("infra     "), m("AWS · Docker · Terraform · Postgres · Redis")],
        ],
      };

    case "experience":
      return {
        rows: [
          [g("2023—now  "), f("Senior Software Engineer"), m(" @ Vercel")],
          [g("2021—2023 "), f("Full-Stack Engineer"), m(" @ Stripe")],
          [g("2019—2021 "), f("Software Engineer"), m(" @ Startup (acquired)")],
          [g("2015—2019 "), f("B.S. Computer Science"), m(" @ UC Berkeley")],
        ],
      };

    case "contact":
      return { rows: [[m("→ "), gr("hello@ashutoshgupta.dev")]], action: { type: "nav", href: "mailto:hello@ashutoshgupta.dev", external: true } };

    case "theme": {
      const value = arg === "dark" || arg === "light" ? (arg as "dark" | "light") : undefined;
      return { rows: [[m("flipping the lights…")]], action: { type: "theme", value } };
    }

    case "clear":
    case "cls":
      return { rows: [], action: { type: "clear" } };

    case "sudo":
      if (arg.replace(/[-\s]/g, "") === "hireme")
        return { rows: [[gr("✓"), m(" permission granted — "), gr("hello@ashutoshgupta.dev")]], action: undefined };
      return { rows: [[m("sudo: a password is required (try "), f("sudo hire-me"), m(")")]] };

    default:
      return {
        rows: [
          [m("command not found: "), f(cmd)],
          [m("type "), g("help"), m(" for a list")],
        ],
      };
  }
}

export function complete(prefix: string): string | null {
  const p = prefix.trim().toLowerCase();
  if (!p || p.includes(" ")) return null;
  const hit = COMMANDS.find((c) => c.startsWith(p));
  return hit ?? null;
}
