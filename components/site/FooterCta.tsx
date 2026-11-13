"use client";

import { useState } from "react";
import { footer, links } from "@/content";

export default function FooterCta() {
  const [on, setOn] = useState(false);
  const enter = () => setOn(true);
  const leave = () => setOn(false);
  const eye = { top: on ? "7px" : "10px", height: on ? "9px" : "3px" };

  return (
    <a
      href={links.email}
      className="cta block no-underline"
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      style={{ color: on ? "var(--accent)" : "var(--fg)" }}
    >
      {/* words reveal one by one as the headline enters (data-words, motionEngine.ts) */}
      <span
        data-words=""
        className="text-[64px] leading-[1.04] tracking-[-0.04em] max-lg:text-[56px] max-sm:text-[44px]"
      >
        {footer.cta.split(" ").map((word, i, all) => (
          <span key={i}>
            <span className="w inline-block">{word}</span>
            {i < all.length - 1 && " "}
          </span>
        ))}
      </span>
      {/* Semi sits inline after the last word, its tail dipping under the baseline like a semicolon.
          Outer span: placement + responsive scale only. Inner .fsemi: the hover look-up transform only. */}
      <span
        aria-hidden="true"
        className="ml-[12px] -mt-4 mb-[-10px] inline-block origin-bottom [scale:.9] max-lg:[scale:.85] max-sm:[scale:.7]"
      >
        <span className="semi fsemi block" style={{ transform: on ? "translateY(-10px) rotate(-8deg)" : "none" }}>
          <span className="relative block h-[26px] w-[26px] rounded-[99px] bg-accent">
            <span className="absolute left-[6px] w-1 rounded-[99px] bg-bg" style={eye} />
            <span className="absolute right-[6px] w-1 rounded-[99px] bg-bg" style={eye} />
          </span>
          <span className="m-[5px_0_0_2px] block h-8 w-[22px] rounded-[99px_99px_99px_7px] bg-accent [clip-path:polygon(0_0,100%_0,100%_60%,34%_100%,20%_100%,42%_60%,0_60%)]" />
        </span>
      </span>
    </a>
  );
}
