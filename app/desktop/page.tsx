import { existsSync } from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import { ashos, meta } from "@/content";
import { contact } from "./_os/data/portfolio";
import { DesktopRoot } from "./_os/Root";

// /desktop is prerendered at build time, so this checks whether the résumé
// PDF ships with the site without the browser having to probe for it (a
// missing file would otherwise log a 404 in the console). null = unknown.
function resumeShipped(): boolean | null {
  try {
    return existsSync(path.join(process.cwd(), "public", contact.resume.replace(/^\//, "")));
  } catch {
    return null;
  }
}

// Visually hidden (the usual sr-only recipe, inline because os.css only
// styles things under .ashos).
const SR_ONLY: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};

export default function DesktopPage() {
  return (
    <>
      {/* The desktop itself mounts on the client, so without this the server
          HTML is only the boot screen. Gives crawlers (and screen readers) the
          page's heading, what it is, and a way back to the site. The link is
          left out of the Tab order so it never takes an invisible focus; in the
          site's ashOS iframe it opens the site in the whole tab. */}
      <div style={SR_ONLY}>
        <h1>{ashos.pageTitle}</h1>
        <p>{ashos.pageDescription}</p>
        <a href="/" target="_top" tabIndex={-1}>
          {meta.title}
        </a>
      </div>
      <DesktopRoot resume={resumeShipped()} />
    </>
  );
}
