"use client";

import { useEffect, useState } from "react";
import { hero, resumeLink } from "@/content";
import { AshOSLink } from "./AshOS";
import { poke } from "./pokes";
import { onHashClick } from "./scroll";

const CLIP = "[clip-path:polygon(0_0,100%_0,100%_60%,34%_100%,20%_100%,42%_60%,0_60%)]";

/* ---------------- name + Semi ---------------- */

function Name() {
  const [pokes, setPokes] = useState(0);
  const lines = hero.semiLines;
  const said = lines[Math.min(pokes, lines.length - 1)];
  const done = pokes >= lines.length - 1; // on the last line: eyes go sleepy

  // Letters keep their global index for the stagger; grouped per word so the
  // name only ever wraps between words on narrow screens.
  const words: { ch: string; i: number }[][] = [];
  let i = 0;
  hero.name.split(" ").forEach((w, wi, all) => {
    const group = [...w].map((ch) => ({ ch, i: i++ }));
    if (wi < all.length - 1) group.push({ ch: " ", i: i++ });
    words.push(group);
  });

  return (
    // The page's heading is just the name, kept out of the visual row: the row
    // (letters, Semi, speech) is laid out exactly as it always was, and the h1
    // never takes display: contents (VoiceOver skips such headings in its
    // heading list, WebKit bug 261978).
    <>
      <h1 className="sr-only">{hero.name}</h1>
      <div className="m-[32px_0_0] flex flex-wrap items-end text-[calc(112px*var(--k))] leading-none font-medium tracking-[-0.045em] [--k:1] max-[639px]:[--k:.75] max-[379px]:[--k:.58]">
        <span aria-hidden="true" className="overflow-hidden pb-[6px] max-[900px]:contents">
          {words.map((group, gi) => (
            <span key={gi} className="whitespace-nowrap max-[900px]:overflow-hidden max-[900px]:pb-[6px]">
              {group.map(({ ch, i }) => (
                <span key={i} className="ltr" style={{ animationDelay: (0.2 + i * 0.045).toFixed(3) + "s", width: "auto" }}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </span>
        <button
          onClick={() => {
            setPokes((p) => p + 1);
            poke(); // adds to the global count shown in the footer
          }}
          aria-label={hero.pokeLabel}
          className="relative ml-[calc(8px*var(--k))] h-[calc(112px*var(--k))] w-[calc(48px*var(--k))] cursor-pointer border-0 bg-transparent p-0"
        >
          {/* scales Semi with the name on small screens; identity at desktop size */}
          <span className="absolute bottom-0 left-0 block h-[112px] w-[48px] origin-bottom-left [scale:var(--k)]">
            <span className="drop absolute bottom-[10px] left-[6px] block h-[86px] w-[34px]">
              <span key={"h" + pokes} className={"block " + (pokes ? "hop" : "")}>
                <span className="sway block">
                  <span aria-hidden="true" className="relative block h-[34px] w-[34px] rounded-[99px] bg-accent">
                    <span className="eye absolute top-[11px] left-[8px] w-[6px] rounded-[99px] bg-bg" style={{ height: done ? "3px" : "9px" }} />
                    <span className="eye absolute top-[11px] right-[8px] w-[6px] rounded-[99px] bg-bg" style={{ height: done ? "3px" : "9px" }} />
                  </span>
                  <span aria-hidden="true" className={"m-[7px_0_0_3px] block h-[43px] w-[29px] rounded-[99px_99px_99px_9px] bg-accent " + CLIP} />
                </span>
              </span>
            </span>
          </span>
        </button>
        {/* the visible bubble re-mounts per poke (so it re-animates); screen
            readers hear the line from the persistent live region below */}
        <span
          key={"s" + pokes}
          aria-hidden="true"
          className="say m-[0_0_20px_16px] font-script text-[30px] font-normal tracking-[0] text-muted max-sm:m-[6px_0_0] max-sm:min-h-[30px] max-sm:basis-full"
          // the hint waits for Semi to land (drop starts 1.1s, lasts 0.9s)
          style={pokes ? undefined : { animationDelay: "2s" }}
        >
          {said || (
            <span className="relative">
              {/* hand-drawn arrow curling back up to Semi, sitting in the gap so it takes no space;
                  on mobile Semi is above-right, so it moves to the end and flips */}
              <svg
                aria-hidden="true"
                viewBox="0 0 28 20"
                className="absolute right-full bottom-[8px] mr-[1px] h-[16px] w-[22px] max-sm:right-auto max-sm:left-full max-sm:ml-[4px] max-sm:-scale-x-100"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M26 17C18 18 8 14 5 5" />
                <path d="M3.6 9.8 5 5 9 8" />
              </svg>
              {hero.semiHint}
            </span>
          )}
        </span>
      </div>
      {/* one live region that stays mounted: a fresh aria-live element per poke
          is often never announced. The keyed child makes a repeated line count
          as new text. */}
      <span role="status" aria-live="polite" className="sr-only">
        {pokes > 0 && <span key={pokes}>{said}</span>}
      </span>
    </>
  );
}

/* ---------------- local time ---------------- */

function LocalTime() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(iv);
  }, []);

  const { timeZone, suffix, moods } = hero.localTime;
  const time = now
    ? new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(now)
    : "--:--";
  const h = now ? parseInt(time.slice(0, 2), 10) : NaN;
  const mood = now ? (moods.find(([max]) => h < max) ?? moods[moods.length - 1])[1] : "";

  return (
    <p className="m-[6px_0_0] tabular-nums">
      {time} {suffix} <span className="text-muted">{mood && "· " + mood}</span>
    </p>
  );
}

/* ---------------- now playing ---------------- */

type Track = { live: boolean; isPlaying?: boolean; title?: string; artist?: string };

const NOW_PLAYING_POLL_MS = 15_000;

function NowPlaying() {
  const [track, setTrack] = useState<Track>({ live: false });
  useEffect(() => {
    let alive = true;
    let latest = 0; // only the newest request may update the widget
    const load = () => {
      // Background tabs skip polls (browsers throttle their timers anyway)...
      if (document.hidden) return;
      const id = ++latest;
      // no-store: a cached answer would freeze the widget (route.ts explains)
      fetch("/api/now-playing", { cache: "no-store" })
        .then((r) => r.json() as Promise<Track>)
        .then((t) => alive && id === latest && setTrack(t))
        .catch(() => {});
    };
    // ...and catch up the moment the tab is visible again.
    const onVisibility = () => {
      if (!document.hidden) load();
    };
    load();
    const iv = setInterval(load, NOW_PLAYING_POLL_MS);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const np = hero.nowPlaying;
  const live = track.live && track.title;
  // Bars move only while something is actually playing; idle and "last played"
  // both show them paused.
  const playing = Boolean(live && track.isPlaying);
  const label = live && !track.isPlaying ? np.lastPlayedLabel : np.label;
  const text = live ? `${track.title} — ${track.artist}` : np.fallback;
  const external = np.href !== "#";

  return (
    <a
      href={np.href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="block no-underline"
    >
      <p className="m-0 flex items-center gap-2 text-muted">
        {label}{" "}
        <span aria-hidden="true" className={"inline-flex h-3 items-end gap-[2px]" + (playing ? "" : " eq-paused")}>
          <span className="eq h-3 bg-spotify" />
          <span className="eq h-3 bg-spotify [animation-delay:.2s] [animation-duration:.8s]" />
          <span className="eq h-3 bg-spotify [animation-delay:.4s] [animation-duration:1.2s]" />
        </span>
      </p>
      <p className="m-[6px_0_0] overflow-hidden text-ellipsis whitespace-nowrap">{text}</p>
    </a>
  );
}

/* ---------------- hero ---------------- */

export default function Hero() {
  return (
    <header id="top" className="p-[120px_0_104px] max-sm:p-[56px_0_72px]">
      <p className="up m-0 inline-flex max-w-full flex-wrap items-center gap-x-[10px] gap-y-1 open-badge rounded-[999px] border border-solid p-[8px_14px] text-[14px] text-muted [animation-delay:.1s] max-sm:rounded-[14px]">
        <span className="pulse h-2 w-2 shrink-0 rounded-[99px] bg-status" />
        <span className="text-fg">{hero.status}</span>
        <span aria-hidden="true" className="max-sm:hidden">·</span>
        <span className="max-sm:basis-full max-sm:pl-[18px]">{hero.statusDetail}</span>
      </p>

      <Name />

      <p className="up m-[28px_0_0] max-w-[820px] text-[38px] leading-[1.25] tracking-[-0.02em] [animation-delay:1.15s] max-sm:text-[28px]">
        {hero.lead}
        <em className="font-serif font-normal text-accent">{hero.leadAccent}</em>
      </p>

      <div className="up mt-[44px] flex flex-wrap gap-3 [animation-delay:1.3s] max-sm:mt-9">
        <a
          href={hero.primaryCta.href}
          onClick={(e) => onHashClick(e)}
          data-magnet="7"
          className="rounded-[12px] bg-fg p-[16px_26px] font-medium text-bg no-underline max-sm:basis-full max-sm:text-center"
        >
          {hero.primaryCta.label}
        </a>
        <a
          {...resumeLink}
          data-magnet="7"
          className="rounded-[12px] border border-line p-[16px_26px] font-medium no-underline max-sm:basis-full max-sm:text-center"
        >
          {hero.secondaryCta.label}
        </a>
        <AshOSLink className="p-[16px_8px] font-mono text-[14px] text-muted no-underline max-sm:p-[12px_0]">
          <span className="link">
          {hero.terminalCta}</span>
        </AshOSLink>
      </div>

      <div className="up mt-[72px] grid grid-cols-4 gap-6 border-t border-line pt-7 text-[15px] [animation-delay:1.45s] max-md:grid-cols-2 max-md:gap-y-7 max-sm:mt-14">
        {hero.facts.map((f) => (
          <div key={f.label}>
            <p className="m-0 text-muted">{f.label}</p>
            <p className="m-[6px_0_0]">{f.value}</p>
          </div>
        ))}
        <div>
          <p className="m-0 text-muted">{hero.localTime.label}</p>
          <LocalTime />
        </div>
        <NowPlaying />
      </div>
    </header>
  );
}
