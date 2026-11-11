"use client";

import { footer } from "@/content";
import { onHashClick } from "./scroll";

/** Footer link back to the top; glides there through Lenis like the logo does. */
export default function BackToTop() {
  return (
    <a
      href="#top"
      onClick={(e) => onHashClick(e)}
      className="totop inline-flex items-center gap-[6px] font-mono text-[12px] text-muted no-underline hover:text-fg"
    >
      <span className="link">{footer.backToTop}</span>
      <span aria-hidden="true" className="totop-arrow inline-block text-accent">
        ↑
      </span>
    </a>
  );
}
