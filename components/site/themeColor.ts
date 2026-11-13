// The browser bar colour (<meta name="theme-color">) for each site theme: the
// page background (--bg in site.css). The site's one theme-color meta isn't
// rendered by Next: the inline theme script (app/layout.tsx) adds it to match
// data-theme, and the bulb (Bulb.tsx) keeps it in step, so it follows the
// visitor's choice rather than the OS. ashOS (/desktop) renders its own
// light/dark media pair (app/desktop/layout.tsx), which this never touches.

export const THEME_COLORS = { light: "#ffffff", dark: "#0b0a12" } as const;

/** Points the site's theme-color meta at `theme`, adding it if it's missing. */
export function setThemeColor(theme: string) {
  if (location.pathname.startsWith("/desktop")) return; // ashOS has its own
  let m = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (m?.media) return; // a media-matched pair (ashOS) isn't ours
  if (!m) {
    m = document.createElement("meta");
    m.name = "theme-color";
    document.head.appendChild(m);
  }
  m.content = theme === "dark" ? THEME_COLORS.dark : THEME_COLORS.light;
}

/** setThemeColor as an ES5 function expression, for the inline theme script. */
export const SET_THEME_COLOR = `(function(t){if(location.pathname.indexOf('/desktop')===0)return;var m=document.querySelector('meta[name="theme-color"]');if(m&&m.media)return;if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=t==='dark'?'${THEME_COLORS.dark}':'${THEME_COLORS.light}'})`;
