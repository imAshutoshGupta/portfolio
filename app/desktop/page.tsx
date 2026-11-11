import { existsSync } from "node:fs";
import path from "node:path";
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

export default function DesktopPage() {
  return <DesktopRoot resume={resumeShipped()} />;
}
