import type { Metadata } from "next";
import { links, meta, nav } from "@/content";

// Share-preview fields every page uses. A page that sets its own `openGraph`
// or `twitter` replaces the parent's whole object (Next merges metadata
// shallowly), so app/layout.tsx and app/desktop/layout.tsx both spread these.

/** The share image: a screenshot of the hero. A new look gets a new file name,
 *  since link previews (LinkedIn, X, WhatsApp) cache images by URL. The old
 *  /og.png stays in public/ for links shared before. */
const OG_IMAGE = "/og-2026-11.png";

/** "@im_AshutoshG", from the X profile link. */
const xHandle = "@" + new URL(links.x).pathname.split("/").filter(Boolean)[0];

export const sharedOpenGraph = {
  siteName: nav.name,
  type: "website",
  locale: "en_IN",
  images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: meta.title }],
} satisfies Metadata["openGraph"];

export const sharedTwitter = {
  card: "summary_large_image",
  creator: xHandle,
  images: [OG_IMAGE],
} satisfies Metadata["twitter"];
