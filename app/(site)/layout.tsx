import { Inter_Tight, JetBrains_Mono, Newsreader, Sacramento } from "next/font/google";
import "lenis/dist/lenis.css";
import "./site.css";

// Self-hosted via next/font. site.css refers to the faces by family name
// (see the note on --font-sans there); the variable classes just load them.
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["italic"],
  variable: "--font-newsreader",
  display: "swap",
});
const sacramento = Sacramento({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sacramento",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const fontVars = [interTight, newsreader, sacramento, jetbrainsMono]
  .map((f) => f.variable)
  .join(" ");

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className={fontVars}>{children}</div>;
}
