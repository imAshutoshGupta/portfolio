"use client";

import { useEffect, useRef, useState } from "react";
import type { projects } from "@/content";

type Demo = NonNullable<(typeof projects)[number]["demo"]>;

// A looping demo for a project card. Nothing downloads until the card scrolls
// into view (preload="none"), and it pauses again when it scrolls out. With
// reduced motion it stays on the poster until someone presses play. The button
// is there because anything that autoplays for more than 5s needs a way to
// pause it (WCAG 2.2.2).
export default function ProjectDemo({ name, demo, alt }: { name: string; demo: Demo; alt: string }) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const sync = useRef<() => void>(() => {});
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
      const want = inView && (choice.current ? choice.current === "play" : !reduce.matches);
      if (want) v.play().catch(() => setPlaying(false));
      else v.pause();
      setPlaying(want);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        sync.current();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    const onReduce = () => sync.current();
    reduce.addEventListener("change", onReduce);
    return () => {
      io.disconnect();
      reduce.removeEventListener("change", onReduce);
    };
  }, []);

  const toggle = () => {
    choice.current = playing ? "pause" : "play";
    sync.current();
  };

  return (
    <div ref={box} className="relative h-full w-full">
      {/* the video itself is hidden from screen readers; this describes what it shows */}
      <div className="shot h-full w-full" role="img" aria-label={alt}>
        <video
          ref={video}
          className="block h-full w-full object-cover"
          src={demo.video}
          poster={demo.poster}
          preload="none"
          muted
          loop
          playsInline
          disablePictureInPicture
          aria-hidden="true"
        />
      </div>
      <button
        type="button"
        onClick={toggle}
        className="demo-btn"
        aria-label={`${playing ? "Pause" : "Play"} the ${name} demo`}
        title={playing ? "Pause" : "Play"}
      >
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
