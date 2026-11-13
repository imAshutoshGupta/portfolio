"use client";

import { useEffect, useState } from "react";
import { footer } from "@/content";
import { poke, usePokes } from "./pokes";

const VIEWED_KEY = "views:counted";
const fmt = new Intl.NumberFormat("en-US");

type ViewsAnswer = { count: number | null };

// One request per page load, shared, so a remounted footer (or React's dev
// double effect) can't count the visit twice.
let viewsRequest: Promise<ViewsAnswer> | null = null;

function loadViews(): Promise<ViewsAnswer> {
  if (viewsRequest) return viewsRequest;
  let counted = false;
  try {
    counted = sessionStorage.getItem(VIEWED_KEY) === "1";
  } catch {}
  viewsRequest = fetch("/api/views", { method: counted ? "GET" : "POST", cache: "no-store" }).then(async (r) => {
    const answer = (await r.json()) as ViewsAnswer;
    // Mark the session only once the view has really been counted: a refused
    // (403/429) or failed POST leaves it unmarked, so the next page load tries again.
    if (!counted && r.ok && answer.count !== null) {
      try {
        sessionStorage.setItem(VIEWED_KEY, "1");
      } catch {}
    }
    return answer;
  });
  viewsRequest.catch(() => {
    viewsRequest = null; // a network error may be retried by a later mount
  });
  return viewsRequest;
}

/** Page views: counted once per browser session (POST), read otherwise. */
function useViews() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    loadViews()
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
  // what the live region says: only after a poke from this button (a hero
  // poke is announced by Semi's own line), keyed so a repeat counts as new
  const [said, setSaid] = useState<{ k: number; text: string } | null>(null);
  if (views === null && pokes === null) return null;

  const v = footer.views;
  const t = footer.pokes;
  const countText = (n: number) => `${fmt.format(n)} ${n === 1 ? t.one : t.many}`;
  const pokesText = pokes === null ? "" : countText(pokes);
  const eye = { height: tired ? "1.5px" : "4px", top: tired ? "5px" : "4px" };

  return (
    <div className="inline-flex items-center overflow-hidden rounded-[999px] border border-line font-mono text-[12px] text-muted tabular-nums">
      {views !== null && (
        <p className={"m-0 " + CHIP}>
          <span aria-hidden="true" className="semi inline-flex gap-[3px]">
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
            if (!poke()) return;
            setHops((h) => h + 1);
            if (pokes !== null) setSaid((s) => ({ k: (s?.k ?? 0) + 1, text: countText(pokes + 1) }));
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
          <span aria-hidden="true" key={hops} className={"semi block " + (hops ? "hop-sm" : "")}>
            <span className="relative block h-[12px] w-[12px] rounded-[99px] bg-accent">
              <span className="eye absolute left-[3px] w-[2px] rounded-[99px] bg-bg" style={eye} />
              <span className="eye absolute right-[3px] w-[2px] rounded-[99px] bg-bg" style={eye} />
            </span>
          </span>
          <span>{pokesText}</span>
        </button>
      )}
      {pokes !== null && (
        <span role="status" aria-live="polite" className="sr-only">
          {said && <span key={said.k}>{said.text}</span>}
        </span>
      )}
    </div>
  );
}
