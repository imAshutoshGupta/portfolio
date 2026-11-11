// Keyboard shortcuts ashOS handles. Labels use ⌘ / ⌥; the UI swaps them for
// Ctrl / Alt on other platforms. Browsers keep some ⌘ combos (⌘W, ⌘Q, ⌘Tab)
// for themselves, so each of those also works with ⌥.

export const SHORTCUTS = [
  { keys: "⌘Space or ⌘K", label: "Spotlight" },
  { keys: "⌥W (or ⌘W)", label: "Close window" },
  { keys: "⌥Q (or ⌘Q)", label: "Quit app" },
  { keys: "⌥Tab (or ⌘Tab)", label: "Switch apps" },
  { keys: "⌥M", label: "Minimise window" },
  { keys: "⌥N", label: "New window" },
  { keys: "Esc", label: "Close menus and dialogs" },
  { keys: "Space", label: "Quick Look the selection (Finder)" },
  { keys: "⌘↓ / ⌘↑", label: "Open / enclosing folder (Finder)" },
];
