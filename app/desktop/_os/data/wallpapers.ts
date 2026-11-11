// Original wallpapers drawn for ashOS (SVG files in /public/ashos/wallpapers).
// Each has a light and a dark variant that follows the appearance.

export type WallpaperId = "hills" | "flow" | "dunes" | "lagoon" | "graphite";

export type Wallpaper = { id: WallpaperId; name: string; light: string; dark: string };

const src = (name: string) => `/ashos/wallpapers/${name}.svg`;

export const WALLPAPERS: Wallpaper[] = [
  { id: "hills", name: "Hills", light: src("hills-light"), dark: src("hills-dark") },
  { id: "flow", name: "Flow", light: src("flow-light"), dark: src("flow-dark") },
  { id: "dunes", name: "Dunes", light: src("dunes-light"), dark: src("dunes-dark") },
  { id: "lagoon", name: "Lagoon", light: src("lagoon-light"), dark: src("lagoon-dark") },
  { id: "graphite", name: "Graphite", light: src("graphite-light"), dark: src("graphite-dark") },
];

export const wallpaperById = (id: string) => WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
