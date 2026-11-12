// A tiny structured-document model. Preview renders it as a page; the
// Terminal's `cat` renders it as text. UI-free.

type Block =
  | { t: "title"; text: string; sub?: string }
  | { t: "h"; text: string }
  | { t: "p"; text: string }
  | { t: "meta"; text: string }
  | { t: "list"; items: string[] }
  | { t: "kv"; rows: [string, string][] }
  | { t: "chips"; items: string[] }
  | { t: "quote"; text: string; by?: string }
  | { t: "links"; items: { label: string; href: string | null }[] }
  | { t: "keys"; rows: [string, string][] }
  | { t: "hr" };

export type Doc = Block[];

const wrap = (s: string, width = 72) => {
  const out: string[] = [];
  for (const para of s.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      if (!word) continue;
      if (line && (line + " " + word).length > width) {
        out.push(line);
        line = word;
      } else line = line ? line + " " + word : word;
    }
    out.push(line);
  }
  return out;
};

/** Plain-text rendering, used by `cat` and for file sizes. */
export function docToLines(doc: Doc, width = 72): string[] {
  const out: string[] = [];
  for (const b of doc) {
    switch (b.t) {
      case "title":
        out.push(b.text.toUpperCase());
        if (b.sub) out.push(...wrap(b.sub, width));
        out.push("");
        break;
      case "h":
        out.push("", "## " + b.text);
        break;
      case "p":
        out.push(...wrap(b.text, width), "");
        break;
      case "meta":
        out.push(b.text);
        break;
      case "list":
        for (const i of b.items) out.push("  • " + i);
        out.push("");
        break;
      case "kv":
      case "keys": {
        const w = Math.max(...b.rows.map(([k]) => k.length));
        for (const [k, v] of b.rows) out.push("  " + k.padEnd(w + 2) + v);
        out.push("");
        break;
      }
      case "chips":
        out.push("  " + b.items.join(" · "), "");
        break;
      case "quote":
        out.push(...wrap("“" + b.text + "”", width - 4).map((l) => "    " + l));
        if (b.by) out.push("      — " + b.by);
        out.push("");
        break;
      case "links":
        for (const l of b.items) out.push("  " + l.label + ": " + (l.href ?? "not linked yet"));
        out.push("");
        break;
      case "hr":
        out.push("—".repeat(Math.min(width, 40)));
        break;
    }
  }
  while (out.length && out[out.length - 1] === "") out.pop();
  return out;
}

export const docSize = (doc: Doc) => new TextEncoder().encode(docToLines(doc).join("\n")).length;

export const docText = (doc: Doc) => docToLines(doc, 1000).join(" ");

/** Shortcut rows with this platform's key labels (`key` from useKeyLabel). */
export const relabelKeys = (doc: Doc, key: (s: string) => string): Doc =>
  doc.map((b) => (b.t === "keys" ? { ...b, rows: b.rows.map(([k, v]): [string, string] => [key(k), v]) } : b));
