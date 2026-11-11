"use client";

import { useEffect, useState } from "react";
import { contact, person } from "../data/portfolio";
import { useOS, useWindowMenus } from "../state/os";
import { Glyph } from "../ui/icons";
import { DragRegion, useWin } from "../ui/Window";

type Box = "inbox" | "sent";
type Sent = { id: number; to: string; subject: string; body: string; from: string; at: Date; delivered: boolean };
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "error"; text: string } | { kind: "manual"; text: string };

const WELCOME = {
  from: person.name,
  subject: person.cta,
  preview: person.lead,
  body: [person.lead, person.bio],
};

export function Mail() {
  const os = useOS();
  const { win } = useWin();
  const [box, setBox] = useState<Box>("inbox");
  const [composing, setComposing] = useState(!!win.args.compose);
  const [sent, setSent] = useState<Sent[]>([]);
  const [openSent, setOpenSent] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "" });
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    if (win.args.compose) setComposing(true);
  }, [win.args.compose, win.args.nonce]);

  useEffect(() => os.setTitle(win.id, composing ? "New Message" : box === "inbox" ? "Inbox" : "Sent"), [os, win.id, composing, box]);

  const mailto = contact.email
    ? `${contact.email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(form.body)}`
    : null;

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setStatus({ kind: "error", text: "Add your email address so I can reply." });
    if (!form.body.trim()) return setStatus({ kind: "error", text: "Write a message first." });
    setStatus({ kind: "sending" });
    let delivered = false;
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, message: (form.subject ? `Subject: ${form.subject}\n\n` : "") + form.body }),
      });
      const d = await r.json().catch(() => ({}));
      delivered = r.ok && d.delivered === true;
    } catch {
      delivered = false;
    }
    if (!delivered) {
      // The site's mail provider isn't set up (or failed): never pretend it sent.
      setStatus({
        kind: "manual",
        text: mailto
          ? "This site can't send mail by itself right now. Your message is still here; send it from your own email app instead."
          : "This site can't send mail by itself right now, and the contact address is still being set up. Copy your message and try LinkedIn instead.",
      });
      return;
    }
    const msg: Sent = { id: Date.now(), to: contact.emailLabel, subject: form.subject || "(no subject)", body: form.body, from: form.email, at: new Date(), delivered };
    setSent((s) => [msg, ...s]);
    setForm({ name: "", email: "", subject: "", body: "" });
    setStatus({ kind: "idle" });
    setComposing(false);
    setBox("sent");
    setOpenSent(msg.id);
    os.notify({ app: "mail", title: "Message sent", body: `Thanks${form.name ? ", " + form.name : ""}. ${person.firstName} will reply to ${msg.from}.` });
  };

  useWindowMenus(win.id, () => [
    {
      title: "File",
      items: [
        { label: "New Message", shortcut: "⌥N", run: () => setComposing(true) },
        { label: "Send", disabled: !composing || status.kind === "sending", run: send },
        { sep: true },
        { label: "Close Window", shortcut: "⌥W", run: () => os.close(win.id) },
      ],
    },
    {
      title: "Mailbox",
      items: [
        { label: "Inbox", checked: box === "inbox" && !composing, run: () => (setBox("inbox"), setComposing(false)) },
        { label: "Sent", checked: box === "sent" && !composing, run: () => (setBox("sent"), setComposing(false)) },
      ],
    },
  ]);

  const links: { label: string; sub: string; glyph: string; run?: () => void }[] = [
    { label: "Email", sub: contact.emailLabel, glyph: "envelope", run: () => setComposing(true) },
    { label: "GitHub", sub: contact.github?.replace(/^https?:\/\/(www\.)?/, "") ?? "not linked yet", glyph: "github", run: contact.github ? () => window.open(contact.github!, "_blank", "noopener") : undefined },
    { label: "LinkedIn", sub: contact.linkedin?.replace(/^https?:\/\/(www\.)?/, "") ?? "not linked yet", glyph: "linkedin", run: contact.linkedin ? () => window.open(contact.linkedin!, "_blank", "noopener") : undefined },
    { label: "Résumé", sub: contact.resumeFile, glyph: "doc", run: () => os.launch("resume") },
  ];

  const sentMsg = sent.find((m) => m.id === openSent);

  return (
    <div className={"ashos-split ashos-mail" + (os.mobile ? " is-compact is-stacked" : "")}>
      <aside className="ashos-sidebar" aria-label="Mailboxes">
        <DragRegion className="ashos-sidebar__top" />
        <nav className="ashos-sidebar__scroll">
          <div className="ashos-sidebar__section">
            <div className="ashos-sidebar__heading">Mailboxes</div>
            <button type="button" className={"ashos-sidebar__item" + (box === "inbox" && !composing ? " is-active" : "")} onClick={() => (setBox("inbox"), setComposing(false))}>
              <Glyph name="tray" />
              <span>Inbox</span>
              <span className="ashos-badge">1</span>
            </button>
            <button type="button" className={"ashos-sidebar__item" + (box === "sent" && !composing ? " is-active" : "")} onClick={() => (setBox("sent"), setComposing(false))}>
              <Glyph name="send" />
              <span>Sent</span>
              {sent.length > 0 && <span className="ashos-badge ashos-badge--quiet">{sent.length}</span>}
            </button>
          </div>
          <div className="ashos-sidebar__section">
            <div className="ashos-sidebar__heading">Contact</div>
            {links.map((l) => (
              <button key={l.label} type="button" className="ashos-sidebar__item ashos-sidebar__item--tall" disabled={!l.run} onClick={l.run}>
                <Glyph name={l.glyph} />
                <span className="ashos-sidebar__two">
                  <span>{l.label}</span>
                  <small>{l.sub}</small>
                </span>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <div className="ashos-split__main">
        <DragRegion className="ashos-toolbar">
          <h2 className="ashos-toolbar__title">
            {composing ? "New Message" : box === "inbox" ? "Inbox" : "Sent"}
            <small>{composing ? "" : box === "inbox" ? "1 message" : `${sent.length} message${sent.length === 1 ? "" : "s"}`}</small>
          </h2>
          <div className="ashos-toolbar__spacer" />
          {composing ? (
            <>
              <button type="button" className="ashos-tbtn" aria-label="Discard draft" title="Discard" onClick={() => (setComposing(false), setStatus({ kind: "idle" }))}>
                <Glyph name="trash" />
              </button>
              <button type="button" className="ashos-btn ashos-btn--primary" disabled={status.kind === "sending"} onClick={send}>
                <Glyph name="paperplane" /> {status.kind === "sending" ? "Sending…" : "Send"}
              </button>
            </>
          ) : (
            <button type="button" className="ashos-tbtn" aria-label="New message" title="New Message" onClick={() => setComposing(true)}>
              <Glyph name="compose" />
            </button>
          )}
        </DragRegion>

        {composing ? (
          <form
            className="ashos-compose"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <div className="ashos-compose__row">
              <span>To:</span>
              <span className="ashos-token">
                {person.name} &lt;{contact.emailLabel}&gt;
              </span>
            </div>
            <label className="ashos-compose__row">
              <span>From:</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" aria-label="Your name" autoComplete="name" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                aria-label="Your email"
                autoComplete="email"
                required
              />
            </label>
            <label className="ashos-compose__row">
              <span>Subject:</span>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} aria-label="Subject" />
            </label>
            <textarea
              className="ashos-compose__body"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder={`Hi ${person.firstName},`}
              aria-label="Message"
            />
            {(status.kind === "error" || status.kind === "manual") && (
              <div className={"ashos-banner" + (status.kind === "error" ? " is-error" : "")} role="alert">
                <Glyph name="info" />
                <span>{status.text}</span>
                {status.kind === "manual" &&
                  (mailto ? (
                    <a className="ashos-btn ashos-btn--sm" href={mailto}>
                      Open in Mail App
                    </a>
                  ) : (
                    <button type="button" className="ashos-btn ashos-btn--sm" onClick={() => navigator.clipboard?.writeText(`${form.subject}\n\n${form.body}`)}>
                      Copy Message
                    </button>
                  ))}
              </div>
            )}
          </form>
        ) : box === "inbox" ? (
          <div className="ashos-mail__panes">
            <div className="ashos-mail__list" role="list">
              <div className="ashos-mail__item is-selected" role="listitem">
                <div className="ashos-mail__top">
                  <b>{WELCOME.from}</b>
                  <small>Today</small>
                </div>
                <div className="ashos-mail__subj">{WELCOME.subject}</div>
                <div className="ashos-mail__prev">{WELCOME.preview}</div>
              </div>
            </div>
            <article className="ashos-mail__read ashos-scroll">
              <header>
                <span className="ashos-avatar ashos-avatar--sm" aria-hidden="true">
                  {person.initials}
                </span>
                <div>
                  <b>{WELCOME.from}</b>
                  <small>To: You</small>
                </div>
              </header>
              <h1>{WELCOME.subject}</h1>
              {WELCOME.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <div className="ashos-mail__sig">— {person.firstName}</div>
              <button type="button" className="ashos-btn ashos-btn--primary" onClick={() => setComposing(true)}>
                <Glyph name="compose" /> Reply
              </button>
            </article>
          </div>
        ) : (
          <div className="ashos-mail__panes">
            <div className="ashos-mail__list" role="list">
              {sent.length ? (
                sent.map((m) => (
                  <button key={m.id} type="button" role="listitem" className={"ashos-mail__item" + (m.id === openSent ? " is-selected" : "")} onClick={() => setOpenSent(m.id)}>
                    <div className="ashos-mail__top">
                      <b>{person.name}</b>
                      <small>{m.at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</small>
                    </div>
                    <div className="ashos-mail__subj">{m.subject}</div>
                    <div className="ashos-mail__prev">{m.body}</div>
                  </button>
                ))
              ) : (
                <div className="ashos-empty">No sent messages</div>
              )}
            </div>
            <article className="ashos-mail__read ashos-scroll">
              {sentMsg ? (
                <>
                  <header>
                    <div>
                      <b>From: {sentMsg.from}</b>
                      <small>To: {sentMsg.to}</small>
                    </div>
                  </header>
                  <h1>{sentMsg.subject}</h1>
                  <p className="ashos-pre">{sentMsg.body}</p>
                </>
              ) : (
                <div className="ashos-empty">No message selected</div>
              )}
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
