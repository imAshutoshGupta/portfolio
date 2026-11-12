/** Links to other sites open in a new tab; "#" placeholders and in-page links don't. */
export const external = (href: string) =>
  /^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
