import type { projects } from "@/content";
import ProjectDemo from "./ProjectDemo";

type Project = (typeof projects)[number];

const TINTS = ["var(--tint-1)", "var(--tint-2)", "var(--tint-3)", "var(--tint-4)"];

// Motion lives in motionEngine.ts: the wrapper staggers in (data-reveal), the card
// tilts toward the cursor (data-tilt). They're separate elements so the two
// transforms never fight. Hover zoom + accent shadow are CSS (.card in site.css).
export default function ProjectCard({ p, i }: { p: Project; i: number }) {
  return (
    <div data-reveal="">
      <article data-tilt="" className="card relative rounded-[16px] border border-line bg-card p-[14px]">
        <div className="aspect-[16/10] overflow-hidden rounded-[10px]" style={{ background: TINTS[i % TINTS.length] }}>
          {p.demo ? (
            <ProjectDemo name={p.name} demo={p.demo} />
          ) : p.screenshot.startsWith("/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.screenshot}
              alt={`${p.name} preview`}
              loading="lazy"
              decoding="async"
              className="shot h-full w-full object-cover"
            />
          ) : (
            <div className="shot flex h-full w-full items-center justify-center text-[13px] text-muted">{p.screenshot}</div>
          )}
        </div>
        <div className="p-[18px_8px_6px]">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="m-0 text-[22px] font-medium tracking-[-0.02em]">{p.name}</h3>
            <span className="text-[13px] text-muted">{p.year}</span>
          </div>
          <p className="m-[8px_0_0] text-[15px] leading-[1.55] text-muted">{p.blurb}</p>
          <div className="mt-[14px] flex flex-wrap gap-[6px]">
            {[p.kind, ...p.stack].map((tag, k) => (
              <span key={k} className="rounded-[6px] bg-soft p-[5px_9px] text-[12px]">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-[18px] flex gap-[18px] text-[14px] font-medium">
            <a href={p.live.href} className="link text-accent">
              {p.live.label}
            </a>
            <a href={p.code.href} className="link">
              {p.code.label}
            </a>
            {p.caseStudy && (
              <a href={p.caseStudy.href} className="link text-muted">
                {p.caseStudy.label}
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
