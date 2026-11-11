"use client";

import type { Doc } from "../data/doc";
import { useOS } from "../state/os";

/** Renders a structured document as a page. Links open inside ashOS. */
export function DocView({ doc, paper = true }: { doc: Doc; paper?: boolean }) {
  const os = useOS();
  const follow = (href: string) => {
    if (href.startsWith("mailto:")) os.launch("mail", { compose: true });
    else os.launch("safari", { url: href });
  };
  return (
    <article className={"ashos-doc" + (paper ? " ashos-doc--paper" : "")}>
      {doc.map((b, i) => {
        switch (b.t) {
          case "title":
            return (
              <header key={i} className="ashos-doc__head">
                <h1>{b.text}</h1>
                {b.sub && <p>{b.sub}</p>}
              </header>
            );
          case "h":
            return <h2 key={i}>{b.text}</h2>;
          case "p":
            return <p key={i}>{b.text}</p>;
          case "meta":
            return (
              <p key={i} className="ashos-doc__meta">
                {b.text}
              </p>
            );
          case "list":
            return (
              <ul key={i}>
                {b.items.map((x, j) => (
                  <li key={j}>{x}</li>
                ))}
              </ul>
            );
          case "kv":
          case "keys":
            return (
              <dl key={i} className={b.t === "keys" ? "ashos-doc__keys" : undefined}>
                {b.rows.map(([k, v], j) => (
                  <div key={j}>
                    <dt>{b.t === "keys" ? <kbd>{k}</kbd> : k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            );
          case "chips":
            return (
              <div key={i} className="ashos-chips">
                {b.items.map((x, j) => (
                  <span key={j} className="ashos-chip">
                    {x}
                  </span>
                ))}
              </div>
            );
          case "quote":
            return (
              <blockquote key={i}>
                <p>“{b.text}”</p>
                {b.by && <cite>{b.by}</cite>}
              </blockquote>
            );
          case "links":
            return (
              <ul key={i} className="ashos-doc__links">
                {b.items.map((l, j) => (
                  <li key={j}>
                    <span>{l.label}</span>
                    {l.href ? (
                      <button type="button" className="ashos-link" onClick={() => follow(l.href!)}>
                        {l.href.replace(/^mailto:|^https?:\/\//, "")}
                      </button>
                    ) : (
                      <span className="ashos-doc__na">Not linked yet</span>
                    )}
                  </li>
                ))}
              </ul>
            );
          case "hr":
            return <hr key={i} />;
        }
      })}
    </article>
  );
}
