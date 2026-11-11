import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type ProviderId = "google" | "openai" | "anthropic";

export interface ProviderInfo {
  label: string;
  defaultModel: string;
  /** Suggestions only; any model id the provider accepts can be typed in. */
  models: string[];
  /** Where the user creates a key. */
  keyUrl: string;
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  google: {
    label: "Google Gemini",
    defaultModel: "gemini-flash-latest",
    models: [
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-pro-latest",
    ],
    keyUrl: "https://aistudio.google.com/apikey",
  },
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-5-mini",
    models: ["gpt-5-mini", "gpt-5", "gpt-5-nano"],
    keyUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    label: "Anthropic Claude",
    defaultModel: "claude-sonnet-5-5",
    models: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"],
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export const isProviderId = (value: unknown): value is ProviderId =>
  typeof value === "string" && value in PROVIDERS;

/** Longest wait for one HTTP response from the provider before giving up. */
export const REQUEST_TIMEOUT_MS = 60_000;

/**
 * `fetch` that fails with a `TimeoutError` instead of hanging forever when the provider
 * does not answer (e.g. the API host is blocked on the user's network).
 * Applied per HTTP request, so time the user spends confirming a tool call does not count.
 */
const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

interface CreateModelParams {
  provider: ProviderId;
  model: string;
  apiKey: string;
}

/** Builds a model that calls the provider straight from the browser with the user's own key. */
export function createModel({ provider, model, apiKey }: CreateModelParams): LanguageModel {
  switch (provider) {
    case "google":
      return createGoogleGenerativeAI({ apiKey, fetch: fetchWithTimeout })(model);
    case "openai":
      return createOpenAI({ apiKey, fetch: fetchWithTimeout })(model);
    case "anthropic":
      return createAnthropic({
        apiKey,
        fetch: fetchWithTimeout,
        // Anthropic rejects browser (CORS) requests unless the caller opts in explicitly.
        // Acceptable here because the key belongs to the user who is using the page.
        headers: { "anthropic-dangerous-direct-browser-access": "true" },
      })(model);
  }
}
