/** Light or dark UI. Shared by the server layout (reads the cookie) and the client shell (writes it). */
export type ThemeMode = "light" | "dark";

export const THEME_COOKIE = "theme";

/** The saved mode, or light when the cookie is missing or holds anything else. */
export function parseThemeMode(value: string | undefined): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

/** Cookie string that remembers the mode for a year, so the server renders the right theme. */
export function themeCookie(mode: ThemeMode): string {
  return `${THEME_COOKIE}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
}
