import { afterEach, describe, expect, it } from "vitest";
import {
  clearApiKey,
  loadAiSettings,
  loadApiKey,
  saveAiSettings,
  saveApiKey,
} from "./keyStore";

afterEach(() => {
  clearApiKey("google");
  clearApiKey("openai");
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("keyStore", () => {
  it("keeps a memory key out of browser storage", () => {
    expect(saveApiKey("google", "k-mem", "memory")).toBe(true);
    expect(loadApiKey("google")).toEqual({ apiKey: "k-mem", persistence: "memory" });
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.length).toBe(0);
  });

  it("stores a session key in sessionStorage only", () => {
    saveApiKey("google", "k-session", "session");
    expect(loadApiKey("google")).toEqual({ apiKey: "k-session", persistence: "session" });
    expect(window.localStorage.length).toBe(0);
  });

  it("stores a remembered key in localStorage", () => {
    saveApiKey("google", "k-local", "local");
    expect(loadApiKey("google")).toEqual({ apiKey: "k-local", persistence: "local" });
  });

  it("keeps the key in one place when the persistence changes", () => {
    saveApiKey("google", "k1", "local");
    saveApiKey("google", "k2", "session");
    expect(window.localStorage.length).toBe(0);
    expect(loadApiKey("google")).toEqual({ apiKey: "k2", persistence: "session" });
  });

  it("keeps keys per provider and clears them", () => {
    saveApiKey("google", "g", "session");
    saveApiKey("openai", "o", "memory");
    clearApiKey("google");
    expect(loadApiKey("google")).toBeNull();
    expect(loadApiKey("openai")?.apiKey).toBe("o");
  });

  it("never writes the key into the settings", () => {
    saveApiKey("google", "secret", "local");
    saveAiSettings({ provider: "google", model: "gemini-flash-latest" });
    expect(loadAiSettings()).toEqual({ provider: "google", model: "gemini-flash-latest" });
    expect(window.localStorage.getItem("llazyemail.ai.settings")).not.toContain("secret");
  });

  it("ignores corrupted settings", () => {
    window.localStorage.setItem("llazyemail.ai.settings", "{not json");
    expect(loadAiSettings()).toEqual({});
  });
});
