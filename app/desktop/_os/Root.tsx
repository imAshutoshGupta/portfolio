"use client";

import { useEffect, useRef, useState } from "react";
import { Desktop } from "./Desktop";
import { AshMark } from "./ui/icons";

// The server renders only the boot screen; the desktop mounts on the client,
// where it can read the visitor's ashOS settings and screen size.
function Boot({ ready }: { ready: boolean }) {
  const [gone, setGone] = useState(false);
  const [fading, setFading] = useState(false);
  const quick = useRef(true);

  // Read the session flag before the desktop mounts: its boot effect sets it
  // in the same commit that flips `ready`, ahead of the effect below.
  useEffect(() => {
    quick.current = matchMedia("(prefers-reduced-motion: reduce)").matches || !!sessionStorage.getItem("ashos:booted");
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t1 = setTimeout(() => setFading(true), quick.current ? 0 : 650);
    const t2 = setTimeout(() => setGone(true), quick.current ? 200 : 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [ready]);

  if (gone) return null;
  return (
    <div className={"ashos ashos-boot" + (fading ? " is-fading" : "") + (ready ? " is-ready" : "")} role="status" aria-label="Starting ashOS">
      <AshMark className="ashos-boot__mark" />
      <span className="ashos-boot__bar">
        <span />
      </span>
    </div>
  );
}

export function DesktopRoot({ resume }: { resume: boolean | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      {mounted && <Desktop resume={resume} />}
      <Boot ready={mounted} />
    </>
  );
}
