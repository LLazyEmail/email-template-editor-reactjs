/**
 * Light/dark theme. Shared by the server (proxy.ts asks for the OS hint, app/layout.tsx reads the
 * cookie and the hint) and the client shell (writes the cookie, follows the OS).
 */

/** The theme actually shown. */
export type ThemeMode = "light" | "dark";

/** What the user picked; "system" follows the OS. */
export type ThemePreference = ThemeMode | "system";

export const THEME_COOKIE = "theme";

/**
 * Client hint with the OS color scheme (Chromium browsers send it when the server asks with
 * Accept-CH). Lets the server render "system" in the right theme on the first paint.
 */
export const COLOR_SCHEME_HINT = "Sec-CH-Prefers-Color-Scheme";

/** The saved preference, or "system" when the cookie is missing or holds anything else. */
export function parseThemePreference(value: string | undefined): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

/** The OS scheme from the hint (`"dark"`, quoted), or light when the browser didn't send it. */
export function parseColorSchemeHint(value: string | null | undefined): ThemeMode {
  return value?.replaceAll('"', "").trim() === "dark" ? "dark" : "light";
}

export function resolveThemeMode(preference: ThemePreference, system: ThemeMode): ThemeMode {
  return preference === "system" ? system : preference;
}

/** Cookie string that remembers the preference for a year, so the server renders it. */
export function themeCookie(preference: ThemePreference): string {
  return `${THEME_COOKIE}=${preference}; path=/; max-age=31536000; SameSite=Lax`;
}
