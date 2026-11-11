// Small line icons for the hobby chips (content.ts → about.hobbies).
// Plain SVG in currentColor, shared by the site and ashOS.

export type HobbyIconName = "headphones" | "tv" | "dumbbell";

export default function HobbyIcon({ name, className }: { name: HobbyIconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "headphones" ? (
        // over-ear headphones: headband + two cups
        <>
          <path d="M2.8 10V8.2a5.2 5.2 0 0 1 10.4 0V10" />
          <rect x="1.8" y="9" width="3.2" height="5" rx="1.3" />
          <rect x="11" y="9" width="3.2" height="5" rx="1.3" />
        </>
      ) : name === "dumbbell" ? (
        // dumbbell: bar, two plates, two end caps
        <>
          <path d="M5.2 8h5.6" />
          <rect x="3" y="4.6" width="2.4" height="6.8" rx="0.9" />
          <rect x="10.6" y="4.6" width="2.4" height="6.8" rx="0.9" />
          <path d="M1.6 6.6v2.8M14.4 6.6v2.8" />
        </>
      ) : (
        // retro TV with antennae, a play button on screen
        <>
          <path d="M5.4 1.8 8 4.6l2.6-2.8" />
          <rect x="1.8" y="4.6" width="12.4" height="9.2" rx="2.2" />
          <path d="M6.9 7.4v3.6l3-1.8z" fill="currentColor" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}
