import type { Metadata } from "next";
import Script from "next/script";
import { meta } from "@/content";
import { SET_THEME_COLOR } from "@/components/site/themeColor";
import { sharedOpenGraph, sharedTwitter } from "./shared-metadata";

export const metadata: Metadata = {
  metadataBase: new URL(meta.url),
  title: meta.title,
  description: meta.description,
  authors: [{ name: "Ashutosh Gupta" }],
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    ...sharedOpenGraph,
    title: meta.title,
    description: meta.description,
    url: meta.url,
  },
  twitter: {
    ...sharedTwitter,
    title: meta.title,
    description: meta.description,
  },
};

// Runs before paint.
// Theme: ?theme= (passed into the ashOS iframe) wins, then the saved choice,
// then the OS preference on a first visit. The browser bar (theme-color)
// follows it: this adds the site's one theme-color meta, which the bulb keeps
// in step. Not rendered by Next: React matches a <meta> by its content when
// hydrating, so changing it here would leave a second, stale one. ashOS
// (/desktop) renders its own light/dark pair, which this leaves alone.
// Motion: html.motion pre-hides scroll-revealed content (site.css) unless the
// user prefers reduced motion. If the page hasn't hydrated within 4s (JS
// blocked or failing), the class comes off so nothing stays hidden.
const THEME_SCRIPT = `(function(){var d=document.documentElement;try{var q=new URLSearchParams(location.search).get('theme'),s=localStorage.getItem('theme'),t=q==='light'||q==='dark'?q:s==='light'||s==='dark'?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');d.setAttribute('data-theme',t);${SET_THEME_COLOR}(t)}catch(e){}try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('motion');setTimeout(function(){if(!('motionPending' in d.dataset)&&!('motionReady' in d.dataset))d.classList.remove('motion')},4000)}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
