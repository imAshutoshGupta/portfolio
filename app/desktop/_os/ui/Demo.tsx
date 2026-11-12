"use client";

import { useEffect, useRef, useState } from "react";
import type { Demo } from "../data/portfolio";

// A project's looping demo, played the way the site plays it
// (components/site/ProjectDemo.tsx). Nothing downloads until it's on screen
// (preload="none"); it pauses when it scrolls out of view or its window is
// minimised. With reduced motion it stays on the poster until someone presses
// play. The button is there because anything that autoplays for more than 5s
// needs a way to pause it (WCAG 2.2.2).
export function DemoVideo({ name, demo, alt, hidden = false }: { name: string; demo: Demo; alt: string; hidden?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const sync = useRef<() => void>(() => {});
  const away = useRef(hidden);
  // null until the visitor presses the button; after that their choice sticks.
  const choice = useRef<"play" | "pause" | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = box.current;
    const v = video.current;
    if (!el || !v) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;

    sync.current = () => {
      const want = inView && !away.current && (choice.current ? choice.current === "play" : !reduce.matches);
      if (want) v.play().catch(() => setPlaying(false));
      else v.pause();
      setPlaying(want);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        sync.current();
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    const onReduce = () => sync.current();
    reduce.addEventListener("change", onReduce);
    return () => {
      io.disconnect();
      reduce.removeEventListener("change", onReduce);
    };
  }, []);

  useEffect(() => {
    away.current = hidden;
    sync.current();
  }, [hidden]);

  const toggle = () => {
    choice.current = playing ? "pause" : "play";
    sync.current();
  };

  return (
    <div ref={box} className="ashos-demo">
      {/* the video itself is hidden from screen readers; this describes what it shows */}
      <div role="img" aria-label={alt}>
        <video ref={video} src={demo.video} poster={demo.poster} preload="none" muted loop playsInline disablePictureInPicture aria-hidden="true" />
      </div>
      <button type="button" className="ashos-demo__btn" onClick={toggle} aria-label={`${playing ? "Pause" : "Play"} the ${name} demo`} title={playing ? "Pause" : "Play"}>
        {playing ? (
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <rect x="2.5" y="2" width="2.4" height="8" rx=".6" />
            <rect x="7.1" y="2" width="2.4" height="8" rx=".6" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3.5 2.2v7.6a.5.5 0 0 0 .76.43l6.2-3.8a.5.5 0 0 0 0-.86l-6.2-3.8a.5.5 0 0 0-.76.43z" />
          </svg>
        )}
      </button>
    </div>
  );
}
