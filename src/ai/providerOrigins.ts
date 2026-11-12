import type { ProviderId } from "./providers";

/**
 * API origins the browser calls for each LLM provider (the AI SDK defaults).
 * Kept apart from providers.ts so the middleware can import it without bundling the AI SDK.
 * The Content-Security-Policy allows only these in connect-src: adding a provider means adding it here.
 */
export const PROVIDER_API_ORIGINS: Record<ProviderId, string> = {
  google: "https://generativelanguage.googleapis.com",
  openai: "https://api.openai.com",
  anthropic: "https://api.anthropic.com",
};
