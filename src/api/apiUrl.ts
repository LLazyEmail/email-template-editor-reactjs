/**
 * Which backend URL the editor calls. Shared by the API client and the Content-Security-Policy
 * (connect-src must allow exactly this origin), so keep it free of browser globals and of axios.
 */

export const DEV_API_URL = "http://localhost:9000";
const BACKEND_PORT = 9000;

export interface PageLocation {
  /** e.g. "https:" (with the colon, as in `window.location.protocol`). */
  protocol: string;
  hostname: string;
}

interface ResolveApiUrlParams {
  /** The page's location in the browser; `undefined` during server-side rendering. */
  location?: PageLocation;
  nodeEnv?: string;
  /** `NEXT_PUBLIC_API_URL`; currently used only during server-side rendering. */
  envUrl?: string;
}

export function resolveApiUrl({ location, nodeEnv, envUrl }: ResolveApiUrlParams): string {
  if (!location) return envUrl || DEV_API_URL;
  if (nodeEnv === "development") return DEV_API_URL;
  return `${location.protocol}//${location.hostname}:${BACKEND_PORT}`;
}
