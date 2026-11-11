import { describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import * as api from "../api/main";
import { buildSystemPrompt, languageName, runAgent } from "./agent";
import { createEditorTools } from "./tools";

vi.mock("../api/main", () => ({
  getTree: vi.fn(() =>
    Promise.resolve([{ key: "1", title: "root", value: "<table>{{content}}</table>", children: [] }])
  ),
  getAllElements: vi.fn(() => Promise.resolve([])),
  saveTree: vi.fn(() => Promise.resolve({})),
  addTreeNode: vi.fn(() => Promise.resolve({})),
  updateTreeNode: vi.fn(),
  deleteTreeNode: vi.fn(),
  addElement: vi.fn(),
  updateElement: vi.fn(),
  deleteElement: vi.fn(),
  generate: vi.fn(),
}));

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};

describe("runAgent", () => {
  it("runs the tool the model asks for, then returns the model's reply", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [
        {
          content: [
            {
              type: "tool-call",
              toolCallId: "call-1",
              toolName: "add_html_node",
              input: JSON.stringify({ parentKey: "1", title: "{{content}}", value: "<p>Hi</p>" }),
            },
          ],
          finishReason: { unified: "tool-calls", raw: undefined },
          usage,
          warnings: [],
        },
        {
          content: [{ type: "text", text: "Added the node." }],
          finishReason: { unified: "stop", raw: undefined },
          usage,
          warnings: [],
        },
      ],
    });
    const onChange = vi.fn();

    const result = await runAgent({
      model,
      locale: "ru-RU",
      messages: [{ role: "user", content: "Add a paragraph" }],
      tools: createEditorTools({ confirm: async () => true, onChange }),
    });

    expect(api.addTreeNode).toHaveBeenCalledWith({
      parentKey: "1",
      item: expect.objectContaining({ title: "{{content}}", value: "<p>Hi</p>" }),
    });
    expect(onChange).toHaveBeenCalledWith("tree");
    expect(result.text).toBe("Added the node.");
    expect(JSON.stringify(model.doGenerateCalls[0].prompt)).toContain("reply in Russian");
    expect(result.responseMessages.map((message) => message.role)).toEqual([
      "assistant",
      "tool",
      "assistant",
    ]);
  });
});

describe("buildSystemPrompt", () => {
  it("uses the browser language when the message language is unclear", () => {
    expect(buildSystemPrompt("ru-RU")).toContain("reply in Russian");
    expect(buildSystemPrompt("es")).toContain("reply in Spanish");
  });

  it("falls back to English for a missing or invalid locale", () => {
    expect(languageName(undefined)).toBe("English");
    expect(languageName("")).toBe("English");
    expect(languageName("!!")).toBe("English");
  });
});
