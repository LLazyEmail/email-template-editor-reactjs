import { PROVIDER_API_ORIGINS } from "../ai/providerOrigins";
import { resolveApiUrl } from "../api/apiUrl";

/**
 * Content-Security-Policy for the editor, built per request by `middleware.ts`.
 *
 * Why: the AI assistant keeps the user's API key in the browser, so an injected script could
 * read it. This policy blocks scripts that don't carry this request's nonce, and limits where the
 * page may send data (connect-src) to our backend and the LLM providers.
 *
 * Note that CSP cannot stop top-level navigation, so it narrows exfiltration rather than ruling it out;
 * rendering untrusted text as text (never HTML) remains the first line of defense.
 */

interface BuildCspParams {
  /** Random per-request value; Next.js adds it to its own scripts automatically. */
  nonce: string;
  isDev: boolean;
  /** Origins of the editor's backend API. */
  apiOrigins: string[];
}

export function buildContentSecurityPolicy({ nonce, isDev, apiOrigins }: BuildCspParams): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'strict-dynamic' lets nonce'd scripts load the lazy chunks (e.g. the chat panel).
    // Dev needs 'unsafe-eval' for webpack's eval source maps and React Refresh.
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    // Ant Design injects its CSS-in-JS as <style> tags at runtime.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      ...Array.from(new Set(apiOrigins)),
      ...Object.values(PROVIDER_API_ORIGINS),
    ],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

interface ApiOriginsParams {
  /** Page protocol as the browser sees it, e.g. "https:". */
  protocol: string;
  hostname: string;
  nodeEnv?: string;
  envUrl?: string;
}

/**
 * The backend origins the page may call: what the API client will resolve in the browser
 * for this page, plus `NEXT_PUBLIC_API_URL` when it is set.
 */
export function apiOriginsFor({ protocol, hostname, nodeEnv, envUrl }: ApiOriginsParams): string[] {
  const origins = [new URL(resolveApiUrl({ location: { protocol, hostname }, nodeEnv })).origin];
  if (envUrl) {
    try {
      origins.push(new URL(envUrl).origin);
    } catch {
      // An invalid URL can't be called anyway; leave it out of the policy.
    }
  }
  return origins;
}
