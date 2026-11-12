"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { dirname, HOME, type Fs } from "../data/fs";
import { useOS, useWindowMenus } from "../state/os";
import { TitleBar, useWin } from "../ui/Window";
import { complete, promptDir, runCommand, type Line, type ShellCtx } from "./shell";

type Entry = { kind: "cmd"; cwd: string; text: string } | { kind: "out"; line: Line };

const CHAR_W = 0.6; // monospace advance, in ems

/** `dir`, or its nearest parent folder that still exists. */
function liveDir(fs: Fs, dir: string): string {
  let p = dir;
  while (p !== HOME && !fs[p]?.children) p = dirname(p);
  return fs[p]?.children ? p : HOME;
}

export function Terminal() {
  const os = useOS();
  const { win, active } = useWin();
  const [cwd, setCwd] = useState(win.args.cwd && os.fs[win.args.cwd]?.children ? win.args.cwd : HOME);
  const [log, setLog] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [recall, setRecall] = useState<number | null>(null);
  const [size, setSize] = useState({ cols: 80, rows: 24 });
  const [login] = useState(() =>
    new Date().toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).replace(/,/g, "")
  );
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const font = os.prefs.terminalFontSize;

  // Columns × rows from the real window size, like a real terminal.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({
        cols: Math.max(20, Math.floor((el.clientWidth - 24) / (font * CHAR_W))),
        rows: Math.max(4, Math.floor((el.clientHeight - 16) / (font * 1.35))),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [font]);

  // Finder can rename or trash the folder this Terminal is in; step out to
  // the nearest folder that still exists rather than sit in a dead path.
  useEffect(() => {
    const next = liveDir(os.fs, cwd);
    if (next !== cwd) setCwd(next);
  }, [os.fs, cwd]);

  const title = `ashutosh — -zsh — ${size.cols}×${size.rows}`;
  useEffect(() => os.setTitle(win.id, `Terminal — ${promptDir(cwd)}`), [os, win.id, cwd]);

  const ctx = useCallback(
    (): ShellCtx => ({
      fs: os.fs,
      cwd,
      cols: size.cols,
      rows: size.rows,
      appearance: os.appearance,
      bootedAt: os.bootedAt,
      history: hist,
      viewport: os.viewport,
    }),
    [os.fs, cwd, size, os.appearance, os.bootedAt, hist, os.viewport]
  );

  const submit = useCallback(
    (raw: string) => {
      const res = runCommand(raw, ctx());
      const entries: Entry[] = [{ kind: "cmd", cwd, text: raw }, ...res.lines.map((line): Entry => ({ kind: "out", line }))];
      let cleared = false;
      for (const fx of res.effects ?? []) {
        if (fx.type === "clear") cleared = true;
        else if (fx.type === "cd") setCwd(fx.path);
        else if (fx.type === "open") os.openPath(fx.path);
        else if (fx.type === "launch") os.launch(fx.app, fx.args ?? {});
        else if (fx.type === "appearance") os.setPref("appearance", fx.value);
        else if (fx.type === "exit") setTimeout(() => os.close(win.id), 350);
      }
      setLog((l) => (cleared ? [] : [...l, ...entries].slice(-600)));
      if (raw.trim()) setHist((h) => (h[h.length - 1] === raw.trim() ? h : [...h, raw.trim()].slice(-200)));
      setInput("");
      setRecall(null);
    },
    [ctx, cwd, os, win.id]
  );

  // A command passed in at launch (Help ▸ Terminal Commands).
  const ran = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (win.args.command && ran.current !== (win.args.nonce ?? 0)) {
      ran.current = win.args.nonce ?? 0;
      submit(win.args.command);
    }
  }, [win.args, submit]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log, input]);

  useEffect(() => {
    if (active && !os.mobile) field.current?.focus({ preventScroll: true });
  }, [active, os.mobile]);

  useWindowMenus(win.id, () => [
    {
      title: "File",
      items: [
        { label: "New Window", shortcut: "⌥N", run: () => os.launch("terminal", { cwd }, { newWindow: true }) },
        { label: "Open Folder in Finder", run: () => os.launch("finder", { path: cwd }, { newWindow: true }) },
        { sep: true },
        { label: "Close Window", shortcut: "⌥W", run: () => os.close(win.id) },
      ],
    },
    {
      title: "Edit",
      items: [
        { label: "Copy", shortcut: "⌘C", run: () => document.execCommand("copy") },
        { label: "Clear Scrollback", run: () => setLog([]) },
      ],
    },
    {
      title: "View",
      items: [
        { label: "Bigger", run: () => os.setPref("terminalFontSize", Math.min(20, font + 1)) },
        { label: "Smaller", run: () => os.setPref("terminalFontSize", Math.max(10, font - 1)) },
        { label: "Default Size", run: () => os.setPref("terminalFontSize", 12.5) },
      ],
    },
  ]);

  const prompt = (dir: string) => (
    <>
      <span className="t-user">ashutosh@ashOS</span> <span className="t-dir">{promptDir(dir)}</span> <span className="t-sym">%</span>{" "}
    </>
  );

  return (
    <div className="ashos-term">
      <TitleBar title={title} />
      <div
        ref={scroller}
        className="ashos-term__screen ashos-scroll"
        style={{ fontSize: font }}
        onMouseUp={() => {
          if (!window.getSelection()?.toString()) field.current?.focus({ preventScroll: true });
        }}
      >
        <div className="t-muted">Last login: {login} on ttys000</div>
        <div className="t-muted">Welcome to ashOS. Type &apos;help&apos; to look around.</div>
        {log.map((e, i) =>
          e.kind === "cmd" ? (
            <div key={i} className="ashos-term__line">
              {prompt(e.cwd)}
              {e.text}
            </div>
          ) : (
            <div key={i} className="ashos-term__line">
              {e.line.length ? e.line.map((seg, j) => (
                <span key={j} className={seg.c ? "t-" + seg.c : undefined}>
                  {seg.t}
                </span>
              )) : " "}
            </div>
          )
        )}
        <label className="ashos-term__input">
          <span className="ashos-term__prompt">{prompt(cwd)}</span>
          <input
            ref={field}
            value={input}
            aria-label="Terminal input. Type help for commands."
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit(input);
              } else if (e.key === "Tab") {
                e.preventDefault();
                const r = complete(input, ctx());
                if (r.options) setLog((l) => [...l, { kind: "cmd", cwd, text: input }, { kind: "out", line: [{ t: r.options!.join("    "), c: "muted" }] }]);
                setInput(r.line);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (!hist.length) return;
                const i = recall === null ? hist.length - 1 : Math.max(0, recall - 1);
                setRecall(i);
                setInput(hist[i]);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (recall === null) return;
                const i = recall + 1;
                if (i >= hist.length) {
                  setRecall(null);
                  setInput("");
                } else {
                  setRecall(i);
                  setInput(hist[i]);
                }
              } else if (e.key === "l" && e.ctrlKey) {
                e.preventDefault();
                setLog([]);
              } else if (e.key === "c" && e.ctrlKey && !window.getSelection()?.toString()) {
                e.preventDefault();
                setLog((l) => [...l, { kind: "cmd", cwd, text: input + "^C" }]);
                setInput("");
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}
