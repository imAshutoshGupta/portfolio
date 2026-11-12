import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ashos } from "@/content";
import { sharedOpenGraph, sharedTwitter } from "../shared-metadata";
import "./os.css";

// ashOS has its own fonts and styles, separate from the portfolio. Every rule
// in os.css is scoped under `.ashos`, and nothing here touches <html>/<body>.
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--ashos-inter", display: "swap", preload: false });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--ashos-mono", display: "swap", preload: false });

export const metadata: Metadata = {
  title: ashos.pageTitle,
  description: ashos.pageDescription,
  // its own page (and in the sitemap), not a copy of the home page's "/"
  alternates: { canonical: "/desktop" },
  // Its own share preview. These replace the root layout's whole openGraph /
  // twitter objects, hence the shared base (app/shared-metadata.ts).
  openGraph: { ...sharedOpenGraph, title: ashos.pageTitle, description: ashos.pageDescription, url: "/desktop" },
  twitter: { ...sharedTwitter, title: ashos.pageTitle, description: ashos.pageDescription },
};

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${inter.variable} ${mono.variable}`}>{children}</div>;
}
