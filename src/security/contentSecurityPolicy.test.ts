import { describe, expect, it } from "vitest";
import { PROVIDER_API_ORIGINS } from "../ai/providerOrigins";
import { PROVIDER_IDS } from "../ai/providers";
import { resolveApiUrl } from "../api/apiUrl";
import { apiOriginsFor, buildContentSecurityPolicy } from "./contentSecurityPolicy";

function directives(policy: string): Record<string, string[]> {
  return Object.fromEntries(
    policy.split("; ").map((directive) => {
      const [name, ...values] = directive.split(" ");
      return [name, values];
    })
  );
}

describe("buildContentSecurityPolicy", () => {
  const policy = directives(
    buildContentSecurityPolicy({ nonce: "abc123", isDev: false, apiOrigins: ["https://editor.example:9000"] })
  );

  it("allows only scripts with this request's nonce", () => {
    expect(policy["script-src"]).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"]);
    expect(policy["script-src"]).not.toContain("'unsafe-inline'");
  });

  it("limits connections to the backend and the LLM providers", () => {
    expect(policy["connect-src"]).toEqual([
      "'self'",
      "https://editor.example:9000",
      "https://generativelanguage.googleapis.com",
      "https://api.openai.com",
      "https://api.anthropic.com",
    ]);
  });

  it("forbids plugins, framing and base/form hijacking", () => {
    expect(policy["object-src"]).toEqual(["'none'"]);
    expect(policy["frame-ancestors"]).toEqual(["'none'"]);
    expect(policy["base-uri"]).toEqual(["'self'"]);
    expect(policy["form-action"]).toEqual(["'self'"]);
  });

  it("lets the email preview load remote images, fonts and stylesheets over https only", () => {
    for (const name of ["img-src", "font-src", "style-src"]) {
      expect(policy[name]).toContain("https:");
      expect(policy[name]).not.toContain("http:");
      expect(policy[name]).not.toContain("*");
    }
  });

  it("allows eval only in development", () => {
    const dev = directives(buildContentSecurityPolicy({ nonce: "n", isDev: true, apiOrigins: [] }));
    expect(dev["script-src"]).toContain("'unsafe-eval'");
    expect(policy["script-src"]).not.toContain("'unsafe-eval'");
  });

  it("has an origin for every provider the assistant offers", () => {
    expect(Object.keys(PROVIDER_API_ORIGINS).sort()).toEqual([...PROVIDER_IDS].sort());
  });
});

describe("apiOriginsFor", () => {
  it("matches the URL the API client uses in production", () => {
    const location = { protocol: "https:", hostname: "editor.example" };
    expect(apiOriginsFor({ ...location, nodeEnv: "production" })).toEqual([
      new URL(resolveApiUrl({ location, nodeEnv: "production" })).origin,
    ]);
    expect(apiOriginsFor({ ...location, nodeEnv: "production" })).toEqual([
      "https://editor.example:9000",
    ]);
  });

  it("uses the fixed dev backend in development", () => {
    expect(apiOriginsFor({ protocol: "http:", hostname: "127.0.0.1", nodeEnv: "development" })).toEqual([
      "http://localhost:9000",
    ]);
  });

  it("adds NEXT_PUBLIC_API_URL and ignores an invalid one", () => {
    const base = { protocol: "http:", hostname: "h", nodeEnv: "production" };
    expect(apiOriginsFor({ ...base, envUrl: "https://api.example/v1" })).toEqual([
      "http://h:9000",
      "https://api.example",
    ]);
    expect(apiOriginsFor({ ...base, envUrl: "not a url" })).toEqual(["http://h:9000"]);
  });
});
