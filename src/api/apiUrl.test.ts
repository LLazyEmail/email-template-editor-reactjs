import { describe, expect, it } from "vitest";
import { resolveApiUrl } from "./apiUrl";

describe("resolveApiUrl", () => {
  it("uses NEXT_PUBLIC_API_URL, else localhost, during server rendering", () => {
    expect(resolveApiUrl({ envUrl: "https://api.example" })).toBe("https://api.example");
    expect(resolveApiUrl({})).toBe("http://localhost:9000");
  });

  it("uses localhost in the browser in development", () => {
    expect(
      resolveApiUrl({ location: { protocol: "http:", hostname: "127.0.0.1" }, nodeEnv: "development" })
    ).toBe("http://localhost:9000");
  });

  it("uses the page host on port 9000 in the browser in production", () => {
    expect(
      resolveApiUrl({ location: { protocol: "https:", hostname: "editor.example" }, nodeEnv: "production" })
    ).toBe("https://editor.example:9000");
  });
});
