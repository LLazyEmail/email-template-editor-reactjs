import { describe, expect, it } from "vitest";
import { replaceRetiredModel } from "./providers";

describe("replaceRetiredModel", () => {
  it("swaps a retired model for the replacement the provider recommends", () => {
    expect(replaceRetiredModel("openai", "gpt-5")).toBe("gpt-6.1-sol");
    expect(replaceRetiredModel("openai", "gpt-5-mini")).toBe("gpt-6.1-terra");
    expect(replaceRetiredModel("openai", "gpt-5-nano-2025-08-07")).toBe("gpt-6-luna");
  });

  it("keeps models that are still served", () => {
    expect(replaceRetiredModel("openai", "gpt-6.2-sol")).toBe("gpt-6.2-sol");
    expect(replaceRetiredModel("google", "gemini-flash-latest")).toBe("gemini-flash-latest");
  });

  it("only looks at the retired list of the given provider", () => {
    expect(replaceRetiredModel("anthropic", "gpt-5-mini")).toBe("gpt-5-mini");
  });
});
