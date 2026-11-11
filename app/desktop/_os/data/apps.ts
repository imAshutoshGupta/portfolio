// The ashOS application registry. UI-free: icons are referenced by key.

export type AppId =
  | "finder"
  | "about"
  | "projects"
  | "terminal"
  | "safari"
  | "mail"
  | "resume"
  | "photos"
  | "preview"
  | "settings";

export type AppDef = {
  id: AppId;
  name: string;
  /** Bundle name shown in /Applications. */
  bundle: string;
  description: string;
  /** Default and minimum window size. */
  size: [number, number];
  min: [number, number];
  /** One window that is re-focused (and re-targeted) on every launch. */
  single?: boolean;
  /** Title-bar style: a slim title bar, or a tall unified toolbar. */
  chrome: "compact" | "unified";
  /** Words Spotlight should also match. */
  keywords?: string[];
};

export const APPS: Record<AppId, AppDef> = {
  finder: {
    id: "finder",
    name: "Finder",
    bundle: "Finder.app",
    description: "Browse the portfolio as files and folders.",
    size: [880, 540],
    min: [520, 320],
    chrome: "unified",
    keywords: ["files", "folders", "browse"],
  },
  about: {
    id: "about",
    name: "About Me",
    bundle: "About Me.app",
    description: "Profile, background and the way I work.",
    size: [760, 580],
    min: [420, 380],
    single: true,
    chrome: "unified",
    keywords: ["profile", "bio", "biography", "who", "me"],
  },
  projects: {
    id: "projects",
    name: "Projects",
    bundle: "Projects.app",
    description: "Selected work and hackathon builds.",
    size: [960, 620],
    min: [520, 400],
    single: true,
    chrome: "unified",
    keywords: ["work", "portfolio", "case study"],
  },
  terminal: {
    id: "terminal",
    name: "Terminal",
    bundle: "Terminal.app",
    description: "A shell over the ashOS file system. Type help.",
    size: [700, 440],
    min: [360, 220],
    chrome: "compact",
    keywords: ["shell", "zsh", "command", "cli"],
  },
  safari: {
    id: "safari",
    name: "Safari",
    bundle: "Safari.app",
    description: "Browse project links and the portfolio.",
    size: [1040, 680],
    min: [480, 340],
    chrome: "unified",
    keywords: ["browser", "web", "internet", "links"],
  },
  mail: {
    id: "mail",
    name: "Mail",
    bundle: "Mail.app",
    description: "Contact details and a message form.",
    size: [880, 560],
    min: [520, 380],
    single: true,
    chrome: "unified",
    keywords: ["email", "contact", "message", "hire"],
  },
  resume: {
    id: "resume",
    name: "Résumé",
    bundle: "Resume.app",
    description: "The latest résumé.",
    size: [780, 760],
    min: [420, 360],
    single: true,
    chrome: "compact",
    keywords: ["resume", "cv", "pdf"],
  },
  photos: {
    id: "photos",
    name: "Photos",
    bundle: "Photos.app",
    description: "Project screenshots and wallpapers.",
    size: [920, 600],
    min: [480, 360],
    single: true,
    chrome: "unified",
    keywords: ["images", "screenshots", "gallery", "pictures"],
  },
  preview: {
    id: "preview",
    name: "Preview",
    bundle: "Preview.app",
    description: "Opens documents and images.",
    size: [700, 720],
    min: [360, 300],
    chrome: "compact",
    keywords: ["viewer", "document"],
  },
  settings: {
    id: "settings",
    name: "System Settings",
    bundle: "System Settings.app",
    description: "Appearance, wallpaper, desktop and dock.",
    size: [780, 560],
    min: [560, 400],
    single: true,
    chrome: "unified",
    keywords: ["preferences", "appearance", "dark mode", "wallpaper", "dock", "settings"],
  },
};

export const APP_ORDER: AppId[] = [
  "finder",
  "about",
  "projects",
  "safari",
  "terminal",
  "mail",
  "photos",
  "resume",
  "preview",
  "settings",
];

/** Apps kept in the dock (left of the divider). Others appear while running. */
export const DOCK_APPS: AppId[] = [
  "finder",
  "about",
  "safari",
  "projects",
  "terminal",
  "mail",
  "photos",
  "resume",
  "settings",
];

export type SettingsPane = "appearance" | "wallpaper" | "desktop" | "about";

/** Per-app launch arguments. `nonce` lets a re-launch re-target a single window. */
export type AppArgs = {
  path?: string;
  location?: "recents";
  project?: string;
  tab?: string;
  url?: string;
  compose?: boolean;
  pane?: SettingsPane;
  album?: string;
  photo?: string;
  cwd?: string;
  /** Terminal: a command to run once opened. */
  command?: string;
  nonce?: number;
};
