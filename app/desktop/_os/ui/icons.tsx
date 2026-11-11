// Original ashOS icon set. App icons follow the familiar rounded-square
// convention but are drawn from scratch here; no Apple artwork is used.

import { useId, type ReactNode } from "react";
import type { AppId } from "../data/apps";
import type { FolderGlyph, FsNode } from "../data/fs";

/* ============================================================
   Small line glyphs (sidebar, toolbar, menu bar) — 20×20 grid.
   ============================================================ */
const G: Record<string, ReactNode> = {
  clock: (
    <>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 5.8V10l2.9 1.8" />
    </>
  ),
  apps: (
    <>
      <path d="M10 3.2 4.1 16.8M10 3.2l5.9 13.6M6.3 11.8h7.4" />
    </>
  ),
  desktop: (
    <>
      <rect x="2.75" y="3.75" width="14.5" height="10" rx="1.6" />
      <path d="M7.5 16.5h5M10 13.75v2.75" />
    </>
  ),
  doc: (
    <>
      <path d="M5.25 2.75h6.2l3.3 3.3v11.2H5.25z" strokeLinejoin="round" />
      <path d="M11.25 2.9v3.35h3.35M7.7 10h4.6M7.7 13h4.6" />
    </>
  ),
  download: (
    <>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v7.2M7 10.4l3 3 3-3" />
    </>
  ),
  folder: <path d="M2.75 5.4c0-.9.7-1.6 1.6-1.6h3.5l1.6 1.9h6.2c.9 0 1.6.7 1.6 1.6v7.5c0 .9-.7 1.6-1.6 1.6H4.35c-.9 0-1.6-.7-1.6-1.6z" strokeLinejoin="round" />,
  code: <path d="M7 6.5 3.5 10 7 13.5M13 6.5l3.5 3.5-3.5 3.5M11.2 4.8 8.8 15.2" />,
  person: (
    <>
      <circle cx="10" cy="7" r="3.1" />
      <path d="M4.2 16.5c.6-3 3-4.6 5.8-4.6s5.2 1.6 5.8 4.6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2.75" y="5.75" width="14.5" height="10.5" rx="1.8" />
      <path d="M7.25 5.6V4.4c0-.6.5-1.15 1.15-1.15h3.2c.6 0 1.15.5 1.15 1.15v1.2M2.9 10.2h14.2" />
    </>
  ),
  sparkles: (
    <>
      <path d="M8.5 3.2 9.9 7.6l4.3 1.4-4.3 1.4-1.4 4.4-1.4-4.4L2.8 9l4.3-1.4z" strokeLinejoin="round" />
      <path d="M15 12.6v4M13 14.6h4" />
    </>
  ),
  trophy: (
    <>
      <path d="M6.2 3.25h7.6v4.3a3.8 3.8 0 0 1-7.6 0z" strokeLinejoin="round" />
      <path d="M6.2 4.8H3.4c0 2.4 1.2 3.7 3.1 3.9M13.8 4.8h2.8c0 2.4-1.2 3.7-3.1 3.9M10 11.4v2.6M6.8 16.75h6.4M7.6 16.6c0-1.4.9-2.6 2.4-2.6s2.4 1.2 2.4 2.6" />
    </>
  ),
  graduation: (
    <>
      <path d="M10 4 2.5 7.6 10 11.2l7.5-3.6z" strokeLinejoin="round" />
      <path d="M5.4 9.2v3.7c1.2 1.3 2.8 2 4.6 2s3.4-.7 4.6-2V9.2M17.5 7.6v4.4" />
    </>
  ),
  pencil: (
    <>
      <path d="M12.6 3.9 16.1 7.4 7.4 16.1H3.9v-3.5z" strokeLinejoin="round" />
      <path d="M10.6 5.9l3.5 3.5" />
    </>
  ),
  envelope: (
    <>
      <rect x="2.75" y="4.75" width="14.5" height="10.5" rx="1.8" />
      <path d="m3.3 5.6 6.7 5.2 6.7-5.2" strokeLinejoin="round" />
    </>
  ),
  disk: (
    <>
      <rect x="2.75" y="5.25" width="14.5" height="9.5" rx="2" />
      <path d="M2.9 10.6h14.2" />
      <circle cx="14.4" cy="12.7" r=".6" fill="currentColor" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 5.4h13M8 5.2V3.9c0-.4.3-.7.7-.7h2.6c.4 0 .7.3.7.7v1.3M5.1 5.6l.8 10.3c.1.8.7 1.3 1.4 1.3h5.4c.7 0 1.3-.5 1.4-1.3l.8-10.3" />
    </>
  ),
  chevronLeft: <path d="M12.3 4.2 6.5 10l5.8 5.8" />,
  chevronRight: <path d="M7.7 4.2 13.5 10l-5.8 5.8" />,
  chevronDown: <path d="M5.5 8 10 12.5 14.5 8" />,
  chevronUp: <path d="M5.5 12 10 7.5l4.5 4.5" />,
  grid: (
    <>
      <rect x="3.25" y="3.25" width="5.5" height="5.5" rx="1.2" />
      <rect x="11.25" y="3.25" width="5.5" height="5.5" rx="1.2" />
      <rect x="3.25" y="11.25" width="5.5" height="5.5" rx="1.2" />
      <rect x="11.25" y="11.25" width="5.5" height="5.5" rx="1.2" />
    </>
  ),
  list: (
    <>
      <path d="M7.2 5.5h9.5M7.2 10h9.5M7.2 14.5h9.5" />
      <circle cx="3.9" cy="5.5" r=".9" fill="currentColor" stroke="none" />
      <circle cx="3.9" cy="10" r=".9" fill="currentColor" stroke="none" />
      <circle cx="3.9" cy="14.5" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  search: (
    <>
      <circle cx="8.6" cy="8.6" r="5.4" />
      <path d="m12.6 12.6 4.4 4.4" />
    </>
  ),
  sidebar: (
    <>
      <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="2.2" />
      <path d="M7.75 3.9v12.2M4.6 7h1.6M4.6 9.4h1.6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.3 10S5 4.8 10 4.8s7.7 5.2 7.7 5.2-2.7 5.2-7.7 5.2S2.3 10 2.3 10z" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.5" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 9v4.6" />
      <circle cx="10" cy="6.4" r=".75" fill="currentColor" stroke="none" />
    </>
  ),
  external: <path d="M8 4.5H4.75v10.75H15.5V12M11 3.75h5.25V9M16 4 9.2 10.8" />,
  share: (
    <>
      <path d="M7 7.5H5.25v9h9.5v-9H13M10 2.9v9.3M7.1 5.6 10 2.75l2.9 2.85" />
    </>
  ),
  reload: <path d="M15.6 10a5.6 5.6 0 1 1-1.7-4M14.4 2.9v3.4h-3.4" />,
  plus: <path d="M10 4.2v11.6M4.2 10h11.6" />,
  minus: <path d="M4.2 10h11.6" />,
  check: <path d="m4.6 10.4 3.5 3.4 7.3-7.6" />,
  x: <path d="m5.2 5.2 9.6 9.6M14.8 5.2l-9.6 9.6" />,
  compose: (
    <>
      <path d="M9.5 3.75H4.75c-.6 0-1 .4-1 1v10.5c0 .6.4 1 1 1h10.5c.6 0 1-.4 1-1V10.5" />
      <path d="m14.6 2.9 2.5 2.5-6.8 6.8-3.1.6.6-3.1z" strokeLinejoin="round" />
    </>
  ),
  send: <path d="M17 3 2.9 9l5.8 2.3L11 17zM8.7 11.3 17 3" strokeLinejoin="round" />,
  tray: (
    <>
      <path d="M2.75 11.25 5 4.75h10l2.25 6.5v4c0 .6-.4 1-1 1H3.75c-.6 0-1-.4-1-1z" strokeLinejoin="round" />
      <path d="M2.9 11.25h4.2l.8 1.8h4.2l.8-1.8h4.2" />
    </>
  ),
  paperplane: <path d="M17 3 2.9 9l5.8 2.3L11 17zM8.7 11.3 17 3" strokeLinejoin="round" />,
  photo: (
    <>
      <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="2" />
      <circle cx="7.2" cy="8" r="1.4" />
      <path d="m3.2 14.6 4.3-4 3 2.7 2.5-2.2 4 3.6" strokeLinejoin="round" />
    </>
  ),
  photos: (
    <>
      <rect x="5.25" y="2.75" width="12" height="10" rx="1.8" />
      <path d="M2.75 6.6v8.6c0 1 .8 1.8 1.8 1.8h9" />
      <path d="m5.7 11.7 3.5-3.3 2.4 2.1 1.9-1.6 3.2 2.8" strokeLinejoin="round" />
    </>
  ),
  heart: <path d="M10 16.5S3 12.6 3 7.7A3.5 3.5 0 0 1 10 6a3.5 3.5 0 0 1 7 1.7c0 4.9-7 8.8-7 8.8z" strokeLinejoin="round" />,
  gear: (
    <>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.6v2.1M10 15.3v2.1M17.4 10h-2.1M4.7 10H2.6M15.2 4.8l-1.5 1.5M6.3 13.7l-1.5 1.5M15.2 15.2l-1.5-1.5M6.3 6.3 4.8 4.8" />
    </>
  ),
  paint: (
    <>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 2.75v14.5" />
      <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor" />
    </>
  ),
  dock: (
    <>
      <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="2" />
      <rect x="5.5" y="12" width="9" height="2.2" rx="1.1" />
    </>
  ),
  wifi: (
    <>
      <path d="M2.4 7.6a11 11 0 0 1 15.2 0M5 10.4a7.2 7.2 0 0 1 10 0M7.6 13.1a3.4 3.4 0 0 1 4.8 0" />
      <circle cx="10" cy="15.6" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  wifiOff: (
    <>
      <path d="M2.4 7.6a11 11 0 0 1 15.2 0M5 10.4a7.2 7.2 0 0 1 10 0M7.6 13.1a3.4 3.4 0 0 1 4.8 0" opacity=".35" />
      <path d="m3.5 3.5 13 13" />
    </>
  ),
  moon: <path d="M15.8 12.4A6.6 6.6 0 0 1 7.6 4.2a6.6 6.6 0 1 0 8.2 8.2z" strokeLinejoin="round" />,
  sun: (
    <>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M10 2.6v1.6M10 15.8v1.6M17.4 10h-1.6M4.2 10H2.6M15.2 4.8l-1.1 1.1M5.9 14.1l-1.1 1.1M15.2 15.2l-1.1-1.1M5.9 5.9 4.8 4.8" />
    </>
  ),
  controls: (
    <>
      <rect x="2.75" y="3.75" width="14.5" height="5" rx="2.5" />
      <circle cx="14.7" cy="6.25" r="1.3" fill="currentColor" stroke="none" />
      <rect x="2.75" y="11.25" width="14.5" height="5" rx="2.5" />
      <circle cx="5.3" cy="13.75" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  music: (
    <>
      <path d="M7.5 15V4.6l9-1.8v10.3" />
      <circle cx="5.6" cy="15" r="1.9" />
      <circle cx="14.6" cy="13.1" r="1.9" />
    </>
  ),
  bell: (
    <>
      <path d="M5 13.6V9a5 5 0 0 1 10 0v4.6l1.4 1.6H3.6z" strokeLinejoin="round" />
      <path d="M8.3 17.2a1.9 1.9 0 0 0 3.4 0" />
    </>
  ),
  globe: (
    <>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M2.9 10h14.2M10 2.75c2 2 2.9 4.5 2.9 7.25S12 15.25 10 17.25C8 15.25 7.1 12.75 7.1 10S8 4.75 10 2.75z" />
    </>
  ),
  link: <path d="M8.6 11.4a3.1 3.1 0 0 0 4.4 0l2.4-2.4a3.1 3.1 0 0 0-4.4-4.4l-.9.9M11.4 8.6a3.1 3.1 0 0 0-4.4 0l-2.4 2.4a3.1 3.1 0 0 0 4.4 4.4l.9-.9" />,
  github: (
    <path
      d="M10 2.2a7.9 7.9 0 0 0-2.5 15.4c.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-3.9 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.5 7.5 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3-1.9 3.7-3.6 3.9.3.2.5.7.5 1.5v2.2c0 .2.1.5.6.4A7.9 7.9 0 0 0 10 2.2z"
      fill="currentColor"
      stroke="none"
    />
  ),
  linkedin: (
    <path
      d="M4.6 2.9a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zM3.2 7.5h2.8v9.4H3.2zm4.6 0h2.7v1.3c.4-.7 1.3-1.5 2.7-1.5 2.9 0 3.4 1.9 3.4 4.4v5.2h-2.8v-4.6c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4v4.7H7.8z"
      fill="currentColor"
      stroke="none"
    />
  ),
  terminal: (
    <>
      <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="2" />
      <path d="m6 8 2.5 2L6 12M10.5 12.5h3.5" />
    </>
  ),
  battery: (
    <>
      <rect x="2.25" y="6.25" width="13.5" height="7.5" rx="2.2" />
      <path d="M17.6 8.8v2.4" />
    </>
  ),
  arrowUp: <path d="M10 16V4.5M5.5 9 10 4.5 14.5 9" />,
  sort: <path d="M6.5 4v12M3.8 6.7 6.5 4l2.7 2.7M13.5 16V4M10.8 13.3l2.7 2.7 2.7-2.7" />,
  zoomIn: (
    <>
      <circle cx="8.6" cy="8.6" r="5.4" />
      <path d="m12.6 12.6 4.4 4.4M8.6 6.4v4.4M6.4 8.6h4.4" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="8.6" cy="8.6" r="5.4" />
      <path d="m12.6 12.6 4.4 4.4M6.4 8.6h4.4" />
    </>
  ),
  star: <path d="m10 2.9 2.1 4.4 4.8.6-3.5 3.3.9 4.8L10 13.7 5.7 16l.9-4.8-3.5-3.3 4.8-.6z" strokeLinejoin="round" />,
  hammer: (
    <>
      <path d="m11 8.9-6.9 6.9a1.4 1.4 0 0 0 2 2L13 10.9" />
      <path d="m9.6 5.4 3.3-2.6 4.6 4.6-2.6 3.3-2-.1-3.4-3.4z" strokeLinejoin="round" />
    </>
  ),
  sliders: <path d="M4 5.5h7M14 5.5h2M4 10h2M9 10h7M4 14.5h8M15 14.5h1M12.5 3.8v3.4M7.5 8.3v3.4M13.5 12.8v3.4" />,
};

export type GlyphName = keyof typeof G;

export function Glyph({ name, className, title }: { name: GlyphName | string; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={"ashos-glyph" + (className ? " " + className : "")}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {G[name] ?? G.doc}
    </svg>
  );
}

/** The ashOS mark: a semicolon (Semi, the site's mascot). */
export function AshMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="5.6" r="2.35" fill="currentColor" />
      <path
        d="M7.65 12.4a2.35 2.35 0 1 1 4.6.7c-.3 1.9-1.5 3.6-3.4 4.6-.4.2-.8-.2-.6-.6.5-.9.8-1.7.9-2.5a2.35 2.35 0 0 1-1.5-2.2z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ============================================================
   App icons — 100×100 canvas, rounded-square body.
   ============================================================ */
function useIds(n: number) {
  const base = useId().replace(/:/g, "");
  return Array.from({ length: n }, (_, i) => `${base}-${i}`);
}

const Shell = ({ fill, children, stroke }: { fill: string; children?: ReactNode; stroke?: string }) => (
  <>
    <rect x="4" y="4" width="92" height="92" rx="21" fill={fill} />
    {children}
    <rect
      x="4.5"
      y="4.5"
      width="91"
      height="91"
      rx="20.5"
      fill="none"
      stroke={stroke ?? "rgba(255,255,255,.28)"}
      strokeWidth="1"
    />
  </>
);

function FinderIcon() {
  const [a, b, c] = useIds(3);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#69c3ff" />
          <stop offset="1" stopColor="#1477e6" />
        </linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f8fc" />
          <stop offset="1" stopColor="#d3e2f0" />
        </linearGradient>
        <clipPath id={c}>
          <rect x="4" y="4" width="92" height="92" rx="21" />
        </clipPath>
      </defs>
      <Shell fill={`url(#${a})`}>
        <path
          clipPath={`url(#${c})`}
          d="M53 4h43v92H48c-2-8-1.8-15 1-22-4.5-1-7-3.6-7.2-7.7 0-3 1.4-5 3.6-6.2C43.6 46 45 25 53 4z"
          fill={`url(#${b})`}
        />
        <path d="M33 33v12M67 33v12" stroke="#13263f" strokeWidth="4.2" strokeLinecap="round" />
        <path d="M28 65c12 9 32 9 44 0" stroke="#13263f" strokeWidth="4" fill="none" strokeLinecap="round" />
      </Shell>
    </svg>
  );
}

function SafariIcon() {
  const [a, b] = useIds(2);
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const r = (i * Math.PI) / 18;
    const o = i % 3 === 0 ? 30 : 32;
    return (
      <path
        key={i}
        d={`M${50 + Math.cos(r) * o} ${50 + Math.sin(r) * o}L${50 + Math.cos(r) * 35} ${50 + Math.sin(r) * 35}`}
        stroke="rgba(255,255,255,.85)"
        strokeWidth={i % 3 === 0 ? 1.6 : 0.9}
      />
    );
  });
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3e6ea" />
        </linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3bc7ff" />
          <stop offset="1" stopColor="#1062e6" />
        </linearGradient>
      </defs>
      <Shell fill={`url(#${a})`} stroke="rgba(0,0,0,.08)">
        <circle cx="50" cy="50" r="38" fill={`url(#${b})`} />
        {ticks}
        <path d="M50 50 70 30 54.5 54.5z" fill="#ff3b30" />
        <path d="M50 50 30 70 45.5 45.5z" fill="#f2f2f2" />
        <path d="M70 30 30 70" stroke="rgba(0,0,0,.08)" strokeWidth=".6" />
      </Shell>
    </svg>
  );
}

function MailIcon() {
  const [a, b] = useIds(2);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fb4ff" />
          <stop offset="1" stopColor="#1366e8" />
        </linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e1ecf7" />
        </linearGradient>
      </defs>
      <Shell fill={`url(#${a})`}>
        <rect x="20" y="30" width="60" height="42" rx="5" fill={`url(#${b})`} />
        <path d="M21.5 32.5 50 55l28.5-22.5" stroke="#9cb4cc" strokeWidth="2.6" fill="none" strokeLinejoin="round" />
        <path d="M22 70l20-18M78 70 58 52" stroke="#c9d7e5" strokeWidth="2" />
      </Shell>
    </svg>
  );
}

function TerminalIcon() {
  const [a] = useIds(1);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4a4e" />
          <stop offset="1" stopColor="#1b1b1d" />
        </linearGradient>
      </defs>
      <Shell fill="#d8d8dc" stroke="rgba(0,0,0,.08)">
        <rect x="12" y="14" width="76" height="72" rx="10" fill={`url(#${a})`} />
        <path d="M12 26V24a10 10 0 0 1 10-10h56a10 10 0 0 1 10 10v2z" fill="#6c6c70" />
        <path d="M24 42 36 51 24 60" stroke="#f5f5f7" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M42 62h18" stroke="#f5f5f7" strokeWidth="4.5" strokeLinecap="round" />
      </Shell>
    </svg>
  );
}

function PhotosIcon() {
  const [a, b, c] = useIds(3);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ececf0" />
        </linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb86b" />
          <stop offset=".55" stopColor="#ff7aa8" />
          <stop offset="1" stopColor="#8a6cff" />
        </linearGradient>
        <clipPath id={c}>
          <rect x="18" y="20" width="64" height="60" rx="9" />
        </clipPath>
      </defs>
      <Shell fill={`url(#${a})`} stroke="rgba(0,0,0,.08)">
        <g clipPath={`url(#${c})`}>
          <rect x="18" y="20" width="64" height="60" fill={`url(#${b})`} />
          <circle cx="63" cy="38" r="7" fill="#fff4c9" />
          <path d="M14 82 38 52l14 15 10-9 24 24z" fill="#2c3a63" />
          <path d="M14 82 38 52l9 10-9 20z" fill="#3e4f80" />
        </g>
      </Shell>
    </svg>
  );
}

function gearPath(cx: number, cy: number, rOut: number, rIn: number, teeth: number) {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const t = i * step;
    const at = (r: number, a: number) => `${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`;
    pts.push(at(rIn, t - step * 0.32), at(rOut, t - step * 0.18), at(rOut, t + step * 0.18), at(rIn, t + step * 0.32));
  }
  return "M" + pts.join("L") + "Z";
}

function SettingsIcon() {
  const [a, b, c] = useIds(3);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b8b8bd" />
          <stop offset="1" stopColor="#6f6f75" />
        </linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f2f4" />
          <stop offset="1" stopColor="#a9a9b0" />
        </linearGradient>
        <linearGradient id={c} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5d5d63" />
          <stop offset="1" stopColor="#8d8d94" />
        </linearGradient>
      </defs>
      <Shell fill={`url(#${a})`}>
        <path d={gearPath(50, 50, 38, 31, 24)} fill="#45454a" />
        <circle cx="50" cy="50" r="29" fill={`url(#${b})`} />
        <circle cx="50" cy="50" r="22" fill={`url(#${c})`} />
        <path d={gearPath(50, 50, 20, 15, 10)} fill="#dcdce0" />
        <circle cx="50" cy="50" r="7" fill="#6f6f75" />
      </Shell>
    </svg>
  );
}

function AboutIcon() {
  const [a, b] = useIds(2);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9b4ff" />
          <stop offset="1" stopColor="#6d4cf0" />
        </linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9e4fb" />
        </linearGradient>
      </defs>
      <Shell fill={`url(#${a})`}>
        <rect x="18" y="24" width="64" height="52" rx="8" fill={`url(#${b})`} />
        <circle cx="38" cy="44" r="8.5" fill="#7b5cf2" />
        <path d="M24.5 66c1.6-7.4 7-11 13.5-11s11.9 3.6 13.5 11z" fill="#7b5cf2" />
        <path d="M58 42h16M58 50h16M58 58h10" stroke="#b9a9ee" strokeWidth="3.4" strokeLinecap="round" />
      </Shell>
    </svg>
  );
}

function ProjectsIcon() {
  const [a] = useIds(1);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f8dff" />
          <stop offset="1" stopColor="#1b3fbf" />
        </linearGradient>
      </defs>
      <Shell fill={`url(#${a})`}>
        <g stroke="rgba(255,255,255,.14)" strokeWidth="1">
          {[20, 32, 44, 56, 68, 80].map((v) => (
            <path key={v} d={`M${v} 8v84M8 ${v}h84`} />
          ))}
        </g>
        <path d="M38 34 22 50l16 16M62 34l16 16-16 16" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M55 28 45 72" stroke="#9fd2ff" strokeWidth="5" strokeLinecap="round" />
      </Shell>
    </svg>
  );
}

function ResumeIcon() {
  const [a] = useIds(1);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb340" />
          <stop offset="1" stopColor="#f2611d" />
        </linearGradient>
      </defs>
      <Shell fill={`url(#${a})`}>
        <path d="M27 16h33l15 15v53a3 3 0 0 1-3 3H27a3 3 0 0 1-3-3V19a3 3 0 0 1 3-3z" fill="#fff" />
        <path d="M60 16v12a3 3 0 0 0 3 3h12" fill="#ffe2c4" />
        <circle cx="38" cy="36" r="6" fill="#f2811d" />
        <path d="M32 54h36M32 62h36M32 70h24" stroke="#c9ccd3" strokeWidth="3.4" strokeLinecap="round" />
      </Shell>
    </svg>
  );
}

function PreviewIcon() {
  const [a, b] = useIds(2);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9f3ff" />
          <stop offset="1" stopColor="#c5d9f2" />
        </linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fd0ff" />
          <stop offset="1" stopColor="#4c7cf0" />
        </linearGradient>
      </defs>
      <Shell fill={`url(#${a})`} stroke="rgba(0,0,0,.08)">
        <g transform="rotate(-8 46 46)">
          <rect x="18" y="22" width="52" height="42" rx="3" fill="#fff" />
          <rect x="22" y="26" width="44" height="34" fill={`url(#${b})`} />
          <path d="M22 60l14-14 9 9 7-6 14 11z" fill="#2e5fa8" />
        </g>
        <circle cx="62" cy="62" r="13" fill="rgba(255,255,255,.45)" stroke="#5a5f6a" strokeWidth="5" />
        <path d="m72 72 12 12" stroke="#5a5f6a" strokeWidth="7" strokeLinecap="round" />
      </Shell>
    </svg>
  );
}

export function TrashIcon({ full = false }: { full?: boolean }) {
  const [a, b] = useIds(2);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9ccd2" />
          <stop offset=".5" stopColor="#f3f4f6" />
          <stop offset="1" stopColor="#b9bcc3" />
        </linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,.7)" />
          <stop offset="1" stopColor="rgba(220,224,230,.55)" />
        </linearGradient>
      </defs>
      {full && (
        <g>
          <path d="M30 22l18-6 6 16-18 6z" fill="#fff" stroke="#d3d6dc" />
          <path d="M50 18h20v20H50z" fill="#f4f4f6" stroke="#d3d6dc" transform="rotate(12 60 28)" />
        </g>
      )}
      <path d="M20 26h60l-6 64a5 5 0 0 1-5 4.5H31a5 5 0 0 1-5-4.5z" fill={`url(#${b})`} stroke="rgba(120,125,135,.6)" strokeWidth="1.2" />
      {[30, 38, 46, 54, 62, 70].map((x, i) => (
        <path key={x} d={`M${x} 32 L${x + (i - 2.5) * 0.6} 88`} stroke="rgba(120,125,135,.45)" strokeWidth="1.6" />
      ))}
      <ellipse cx="50" cy="26" rx="31" ry="5" fill={`url(#${a})`} stroke="rgba(120,125,135,.6)" strokeWidth="1.2" />
    </svg>
  );
}

const APP_ICON: Record<AppId, () => ReactNode> = {
  finder: FinderIcon,
  about: AboutIcon,
  projects: ProjectsIcon,
  terminal: TerminalIcon,
  safari: SafariIcon,
  mail: MailIcon,
  resume: ResumeIcon,
  photos: PhotosIcon,
  preview: PreviewIcon,
  settings: SettingsIcon,
};

export function AppIcon({ app, className }: { app: AppId; className?: string }) {
  const Icon = APP_ICON[app];
  return (
    <span className={"ashos-appicon" + (className ? " " + className : "")} aria-hidden="true">
      <Icon />
    </span>
  );
}

/* ============================================================
   Finder item icons: folders, documents, links, images, volume.
   ============================================================ */
const FOLDER_GLYPH: Record<FolderGlyph, GlyphName | null> = {
  generic: null,
  applications: "apps",
  desktop: "desktop",
  documents: "doc",
  downloads: "download",
  projects: "code",
  about: "person",
  experience: "briefcase",
  education: "graduation",
  skills: "sparkles",
  achievements: "trophy",
  writing: "pencil",
  contact: "envelope",
  trash: "trash",
};

export function FolderIcon({ glyph = "generic" }: { glyph?: FolderGlyph }) {
  const [a, b] = useIds(2);
  const g = FOLDER_GLYPH[glyph];
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fb4f0" />
          <stop offset="1" stopColor="#3f97e0" />
        </linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ad3fb" />
          <stop offset="1" stopColor="#6cbaf3" />
        </linearGradient>
      </defs>
      <path d="M8 22a5 5 0 0 1 5-5h22l7 7h45a5 5 0 0 1 5 5v51a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z" fill={`url(#${a})`} />
      <path d="M8 33a5 5 0 0 1 5-5h74a5 5 0 0 1 5 5v47a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z" fill={`url(#${b})`} />
      <path d="M9 33.5a4.5 4.5 0 0 1 4.5-4.5h73a4.5 4.5 0 0 1 4.5 4.5" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" fill="none" />
      {g && (
        <svg x="34" y="40" width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="#3a8fd6" strokeWidth="1.7" strokeLinecap="round" color="#3a8fd6" opacity=".85">
          {G[g]}
        </svg>
      )}
    </svg>
  );
}

const BADGE: Record<string, [string, string]> = {
  pdf: ["PDF", "#e5463b"],
  md: ["MD", "#6b6f78"],
  txt: ["TXT", "#8a8e96"],
  vcf: ["VCF", "#7b5cf2"],
};

function DocumentIcon({ ext }: { ext?: string }) {
  const [a] = useIds(1);
  const badge = BADGE[ext ?? ""];
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f1f2f4" />
        </linearGradient>
      </defs>
      <path d="M24 8h37l19 19v62a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z" fill={`url(#${a})`} stroke="rgba(0,0,0,.18)" strokeWidth="1" />
      <path d="M61 8v16a3 3 0 0 0 3 3h16" fill="#e4e6ea" stroke="rgba(0,0,0,.18)" strokeWidth="1" />
      {ext === "vcf" ? (
        <g fill="#b3a3ee">
          <circle cx="50" cy="44" r="9" />
          <path d="M34 66c2-8 8-11.5 16-11.5S64 58 66 66z" />
        </g>
      ) : (
        <path d="M31 36h28M31 44h38M31 52h38M31 60h30" stroke="#d4d7dd" strokeWidth="3" strokeLinecap="round" />
      )}
      {badge && (
        <>
          <rect x="27" y="70" width="46" height="14" rx="3" fill={badge[1]} />
          <text x="50" y="80.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="-apple-system, system-ui, sans-serif">
            {badge[0]}
          </text>
        </>
      )}
    </svg>
  );
}

function LinkIcon({ mail }: { mail: boolean }) {
  const [a, b] = useIds(2);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef0f3" />
        </linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mail ? "#4fb4ff" : "#57c8ff"} />
          <stop offset="1" stopColor={mail ? "#1366e8" : "#1a7ae6"} />
        </linearGradient>
      </defs>
      <path d="M24 8h37l19 19v62a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z" fill={`url(#${a})`} stroke="rgba(0,0,0,.18)" strokeWidth="1" />
      <path d="M61 8v16a3 3 0 0 0 3 3h16" fill="#e4e6ea" stroke="rgba(0,0,0,.18)" strokeWidth="1" />
      <circle cx="50" cy="56" r="20" fill={`url(#${b})`} />
      <svg x="38" y="44" width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" color="#fff">
        {mail ? G.envelope : G.globe}
      </svg>
    </svg>
  );
}

function VolumeIcon() {
  const [a] = useIds(1);
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f3f5" />
          <stop offset="1" stopColor="#b9bcc3" />
        </linearGradient>
      </defs>
      <rect x="10" y="30" width="80" height="44" rx="8" fill={`url(#${a})`} stroke="rgba(0,0,0,.2)" />
      <path d="M10 60h80" stroke="rgba(0,0,0,.15)" />
      <circle cx="78" cy="67" r="2.4" fill="#34c759" />
    </svg>
  );
}

/** A generated "screenshot" cover, used until a real image exists. */
export function Cover({ seed, title, caption, src }: { seed: number; title: string; caption?: string; src?: string | null }) {
  const [a, b] = useIds(2);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="ashos-cover-img" src={src} alt={title} draggable={false} />;
  }
  const hues = [222, 262, 168, 18, 328, 196];
  const h = hues[seed % hues.length];
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className="ashos-cover" role="img" aria-label={`${title}${caption ? ` (${caption})` : ""}`}>
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${h} 80% 72%)`} />
          <stop offset="1" stopColor={`hsl(${h + 40} 70% 52%)`} />
        </linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,.96)" />
          <stop offset="1" stopColor="rgba(255,255,255,.86)" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${a})`} />
      <g transform="translate(40 34)">
        <rect width="240" height="150" rx="9" fill={`url(#${b})`} />
        <circle cx="13" cy="12" r="3.2" fill="#ff5f57" />
        <circle cx="24" cy="12" r="3.2" fill="#febc2e" />
        <circle cx="35" cy="12" r="3.2" fill="#28c840" />
        <rect x="16" y="34" width="96" height="10" rx="5" fill={`hsl(${h} 60% 60%)`} opacity=".85" />
        <rect x="16" y="52" width="150" height="6" rx="3" fill="#d9dce2" />
        <rect x="16" y="64" width="128" height="6" rx="3" fill="#d9dce2" />
        <rect x="16" y="88" width="64" height="44" rx="6" fill={`hsl(${h} 70% 92%)`} />
        <rect x="88" y="88" width="64" height="44" rx="6" fill={`hsl(${h + 30} 70% 92%)`} />
        <rect x="160" y="88" width="64" height="44" rx="6" fill={`hsl(${h + 60} 70% 92%)`} />
      </g>
    </svg>
  );
}

export function NodeIcon({ node, className }: { node: FsNode; className?: string }) {
  let icon: ReactNode;
  if (node.kind === "app" && node.app) return <AppIcon app={node.app} className={className} />;
  if (node.kind === "volume") icon = <VolumeIcon />;
  else if (node.kind === "folder") icon = node.path === "/Trash" ? <TrashIcon full={!!node.children?.length} /> : <FolderIcon glyph={node.glyph} />;
  else if (node.kind === "link") icon = <LinkIcon mail={!!node.href?.startsWith("mailto:")} />;
  else if (node.kind === "image" && node.image)
    icon = (
      <span className="ashos-thumb">
        <Cover seed={node.image.seed} title={node.image.title} src={node.image.src} />
      </span>
    );
  else if (node.kind === "document" && node.app === "resume") icon = <DocumentIcon ext="pdf" />;
  else icon = <DocumentIcon ext={node.ext} />;
  return (
    <span className={"ashos-nodeicon" + (className ? " " + className : "")} aria-hidden="true">
      {icon}
    </span>
  );
}
