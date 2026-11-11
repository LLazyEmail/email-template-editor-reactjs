/**
 * Where the user's own LLM API key lives. The key never goes to our backend:
 * it stays in this browser and is sent only to the chosen LLM provider.
 *
 * - "memory": gone on page reload (safest).
 * - "session": survives reloads, cleared when the tab is closed (default).
 * - "local": remembered on this device until the user removes it.
 *
 * No browser storage protects against XSS; keeping the page free of XSS is
 * what actually protects the key (see docs/AI_AGENT.md).
 */
import type { ProviderId } from "./providers";

export type KeyPersistence = "memory" | "session" | "local";

export interface StoredKey {
  apiKey: string;
  persistence: KeyPersistence;
}

const KEY_PREFIX = "llazyemail.ai.key.";
const SETTINGS_KEY = "llazyemail.ai.settings";

const memoryKeys = new Map<ProviderId, string>();

function getStorage(kind: "session" | "local"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    // Storage can throw when site data is blocked (e.g. some private modes).
    return null;
  }
}

function readItem(kind: "session" | "local", name: string): string | null {
  try {
    return getStorage(kind)?.getItem(name) ?? null;
  } catch {
    return null;
  }
}

function removeItem(kind: "session" | "local", name: string): void {
  try {
    getStorage(kind)?.removeItem(name);
  } catch {
    // Nothing to remove if storage is unavailable.
  }
}

export function loadApiKey(provider: ProviderId): StoredKey | null {
  const inMemory = memoryKeys.get(provider);
  if (inMemory) return { apiKey: inMemory, persistence: "memory" };

  for (const kind of ["session", "local"] as const) {
    const apiKey = readItem(kind, KEY_PREFIX + provider);
    if (apiKey) return { apiKey, persistence: kind };
  }
  return null;
}

/**
 * Saves the key in exactly one place. Returns false when the requested browser
 * storage is unavailable; the key is then not saved at all, so the caller can tell the user.
 */
export function saveApiKey(
  provider: ProviderId,
  apiKey: string,
  persistence: KeyPersistence
): boolean {
  clearApiKey(provider);
  if (persistence === "memory") {
    memoryKeys.set(provider, apiKey);
    return true;
  }
  try {
    const storage = getStorage(persistence);
    if (!storage) return false;
    storage.setItem(KEY_PREFIX + provider, apiKey);
    return true;
  } catch {
    return false;
  }
}

export function clearApiKey(provider: ProviderId): void {
  memoryKeys.delete(provider);
  removeItem("session", KEY_PREFIX + provider);
  removeItem("local", KEY_PREFIX + provider);
}

/** Non-secret preferences (provider + model). Never contains the key. */
export interface AiSettings {
  provider: ProviderId;
  model: string;
}

export function loadAiSettings(): Partial<AiSettings> {
  const raw = readItem("local", SETTINGS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAiSettings(settings: AiSettings): void {
  try {
    getStorage("local")?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Preferences are a convenience; the chat still works without them.
  }
}
