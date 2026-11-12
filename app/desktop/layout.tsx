import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { person } from "./_os/data/portfolio";
import "./os.css";

// ashOS has its own fonts and styles, separate from the portfolio. Every rule
// in os.css is scoped under `.ashos`, and nothing here touches <html>/<body>.
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--ashos-inter", display: "swap", preload: false });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--ashos-mono", display: "swap", preload: false });

export const metadata: Metadata = {
  title: `ashOS — ${person.name}`,
  description: `${person.name}'s portfolio as an interactive desktop.`,
  // its own page (and in the sitemap), not a copy of the home page's "/"
  alternates: { canonical: "/desktop" },
};

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${inter.variable} ${mono.variable}`}>{children}</div>;
}
