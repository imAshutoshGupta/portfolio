"use client";

import { useEffect, useState } from "react";
import { footer } from "@/content";
import { poke, usePokes } from "./pokes";

const VIEWED_KEY = "views:counted";
const fmt = new Intl.NumberFormat("en-US");

/** Page views: counted once per browser session (POST), read otherwise. */
function useViews() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let counted = false;
    try {
      counted = sessionStorage.getItem(VIEWED_KEY) === "1";
      sessionStorage.setItem(VIEWED_KEY, "1");
    } catch {}
    let alive = true;
    fetch("/api/views", { method: counted ? "GET" : "POST", cache: "no-store" })
      .then((r) => r.json() as Promise<{ count: number | null }>)
      .then(({ count }) => alive && setCount(count))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return count;
}

const CHIP = "inline-flex h-[30px] items-center gap-[8px] px-[12px]";

/**
 * Footer stats pill: page views (Semi's eyes) | Semi pokes (Semi's head; click
 * to poke, hero pokes count too). Each half hides when its count isn't
 * available (no KV binding), and the pill hides when both are.
 */
export default function FooterStats() {
  const views = useViews();
  const { total: pokes, tired } = usePokes();
  const [hops, setHops] = useState(0);
  if (views === null && pokes === null) return null;

  const v = footer.views;
  const t = footer.pokes;
  const pokesText = pokes === null ? "" : `${fmt.format(pokes)} ${pokes === 1 ? t.one : t.many}`;
  const eye = { height: tired ? "1.5px" : "4px", top: tired ? "5px" : "4px" };

  return (
    <div className="inline-flex items-center overflow-hidden rounded-[999px] border border-line font-mono text-[12px] text-muted tabular-nums">
      {views !== null && (
        <p className={"m-0 " + CHIP}>
          <span aria-hidden="true" className="inline-flex gap-[3px]">
            <span className="eye block h-[8px] w-[3px] rounded-[99px] bg-accent" />
            <span className="eye block h-[8px] w-[3px] rounded-[99px] bg-accent" />
          </span>
          {fmt.format(views)} {views === 1 ? v.one : v.many}
        </p>
      )}
      {views !== null && pokes !== null && <span aria-hidden="true" className="h-[14px] w-px bg-line" />}
      {pokes !== null && (
        <button
          type="button"
          onClick={() => {
            if (poke()) setHops((h) => h + 1);
          }}
          aria-label={`${t.poke}. ${pokesText}${tired ? `. ${t.tired}` : ""}`}
          aria-disabled={tired || undefined}
          title={tired ? t.tired : t.poke}
          className={
            CHIP +
            " border-0 bg-transparent font-mono text-[12px] text-muted transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent " +
            (tired ? "cursor-default" : "cursor-pointer hover:bg-soft hover:text-fg")
          }
        >
          {/* Semi's head; hops on each poke */}
          <span aria-hidden="true" key={hops} className={"block " + (hops ? "hop-sm" : "")}>
            <span className="relative block h-[12px] w-[12px] rounded-[99px] bg-accent">
              <span className="eye absolute left-[3px] w-[2px] rounded-[99px] bg-bg" style={eye} />
              <span className="eye absolute right-[3px] w-[2px] rounded-[99px] bg-bg" style={eye} />
            </span>
          </span>
          <span aria-live="polite">{pokesText}</span>
        </button>
      )}
    </div>
  );
}
