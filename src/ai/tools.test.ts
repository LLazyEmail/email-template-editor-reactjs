import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../api/main";
import { createEditorTools, type EditorToolsOptions } from "./tools";

vi.mock("../api/main", () => ({
  getTree: vi.fn(),
  getAllElements: vi.fn(),
  saveTree: vi.fn(() => Promise.resolve({})),
  addTreeNode: vi.fn(() => Promise.resolve({})),
  updateTreeNode: vi.fn(() => Promise.resolve({})),
  deleteTreeNode: vi.fn(() => Promise.resolve({})),
  addElement: vi.fn(() => Promise.resolve({})),
  updateElement: vi.fn(() => Promise.resolve({})),
  deleteElement: vi.fn(() => Promise.resolve({})),
  generate: vi.fn(() => Promise.resolve("http://localhost:9000/template.html")),
}));

const tree = [
  {
    key: "root",
    title: "root",
    value: "<table>{{content}}{{footer}}</table>",
    children: [{ key: "child", title: "{{content}}", value: "<p>Hi</p>", children: [] }],
  },
];

const elements = [{ key: "el1", title: "Heading", value: "<h1>{{title}}</h1>" }];

function setup(overrides: Partial<EditorToolsOptions> = {}) {
  const options = {
    confirm: vi.fn(() => Promise.resolve(true)),
    onChange: vi.fn(),
    onToolEvent: vi.fn(),
    ...overrides,
  };
  const tools = createEditorTools(options);
  const call = (name: string, input: unknown) =>
    tools[name].execute!(input, { toolCallId: "call-1", messages: [], context: {} });
  return { options, call };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getTree).mockResolvedValue(tree);
  vi.mocked(api.getAllElements).mockResolvedValue(elements);
});

describe("editor tools", () => {
  it("get_tree returns an outline without full HTML", async () => {
    const { call } = setup();
    const result = await call("get_tree", {});
    expect(result).toMatchObject({
      ok: true,
      tree: [
        {
          key: "root",
          placeholders: ["{{content}}", "{{footer}}"],
          freePlaceholders: ["{{footer}}"],
          children: [{ key: "child", valuePreview: "<p>Hi</p>" }],
        },
      ],
    });
  });

  it("get_tree marks children that will not be rendered", async () => {
    vi.mocked(api.getTree).mockResolvedValueOnce([
      {
        key: "root",
        title: "root",
        value: "{{items}}",
        children: [
          { key: "a", title: "{{items}}", value: "", children: [] },
          { key: "b", title: "{{items}}", value: "", children: [] },
          { key: "c", title: "{{missing}}", value: "", children: [] },
        ],
      },
    ]);
    const { call } = setup();
    const result = (await call("get_tree", {})) as { tree: { children: object[] }[] };
    expect(result.tree[0].children).toEqual([
      expect.not.objectContaining({ notRendered: true }),
      expect.objectContaining({ key: "b", notRendered: true }),
      expect.objectContaining({ key: "c", notRendered: true }),
    ]);
  });

  it("refuses to add into a placeholder that is already taken and explains the fix", async () => {
    const { call } = setup();
    const result = (await call("add_html_node", {
      parentKey: "root",
      title: "{{content}}",
      value: "<p>Dup</p>",
    })) as { ok: boolean; error: string };
    expect(result.ok).toBe(false);
    expect(result.error).toContain("already filled");
    expect(result.error).toContain("Free placeholders there: {{footer}}");
    expect(result.error).toContain("edit_node_text");
    expect(api.addTreeNode).not.toHaveBeenCalled();
  });

  it("refuses to add under a parent without that placeholder", async () => {
    const { call } = setup();
    const result = (await call("add_element_node", {
      parentKey: "root",
      elementKey: "el1",
      title: "{{nope}}",
    })) as { ok: boolean; error: string };
    expect(result.error).toContain('has no "{{nope}}" placeholder');
    expect(api.addTreeNode).not.toHaveBeenCalled();
  });

  it("edit_node_text replaces a unique piece of text", async () => {
    const { call, options } = setup();
    const result = await call("edit_node_text", {
      key: "root",
      find: "{{footer}}",
      replace: "{{footer}}\n{{items2}}",
    });
    expect(api.updateTreeNode).toHaveBeenCalledWith({
      key: "root",
      title: "root",
      value: "<table>{{content}}{{footer}}\n{{items2}}</table>",
    });
    expect(result).toEqual({ ok: true, freePlaceholders: ["{{footer}}", "{{items2}}"] });
    expect(options.onChange).toHaveBeenCalledWith("tree");
  });

  it("edit_node_text rejects missing or ambiguous text", async () => {
    vi.mocked(api.getTree).mockResolvedValue([
      { key: "n", title: "n", value: "<p>a</p><p>a</p>", children: [] },
    ]);
    const { call } = setup();
    expect(await call("edit_node_text", { key: "n", find: "zzz", replace: "" })).toMatchObject({
      ok: false,
      error: expect.stringContaining("not found"),
    });
    expect(await call("edit_node_text", { key: "n", find: "<p>a</p>", replace: "" })).toMatchObject(
      { ok: false, error: expect.stringContaining("occurs 2 times") }
    );
    expect(api.updateTreeNode).not.toHaveBeenCalled();
  });

  it("get_node returns snippets instead of a huge value", async () => {
    const filler = "x".repeat(30_000);
    vi.mocked(api.getTree).mockResolvedValue([
      { key: "big", title: "root", value: `${filler}<h1>Hello</h1>{{items}}${filler}`, children: [] },
    ]);
    const { call } = setup();

    const plain = (await call("get_node", { key: "big" })) as { node: Record<string, unknown> };
    expect(plain.node.value).toBeUndefined();
    expect(plain.node.truncated).toBe(true);
    const around = (plain.node.snippetsAroundPlaceholders as Record<string, string[]>)["{{items}}"];
    expect(around[0]).toContain("<h1>Hello</h1>{{items}}");

    const searched = (await call("get_node", { key: "big", search: "Hello" })) as {
      node: { matches: number; snippets: string[] };
    };
    expect(searched.node.matches).toBe(1);
    expect(searched.node.snippets[0]).toContain("<h1>Hello</h1>");
  });

  it("add_html_node adds a node and reports a tree change", async () => {
    const { call, options } = setup();
    const result = await call("add_html_node", {
      parentKey: "root",
      title: "{{footer}}",
      value: "<p>New</p>",
    });

    expect(result).toMatchObject({ ok: true });
    expect(api.addTreeNode).toHaveBeenCalledWith({
      parentKey: "root",
      item: expect.objectContaining({ title: "{{footer}}", value: "<p>New</p>" }),
    });
    expect(options.onChange).toHaveBeenCalledWith("tree");
    expect(options.onToolEvent).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it("add_element_node fills element placeholders", async () => {
    const { call } = setup();
    await call("add_element_node", {
      parentKey: "root",
      elementKey: "el1",
      title: "{{footer}}",
      fills: { "{{title}}": "Welcome" },
    });
    expect(api.addTreeNode).toHaveBeenCalledWith({
      parentKey: "root",
      item: expect.objectContaining({
        value: "<h1>{{title}}</h1>",
        children: [expect.objectContaining({ title: "{{title}}", value: "Welcome" })],
      }),
    });
  });

  it("update_node keeps fields that were not passed", async () => {
    const { call } = setup();
    await call("update_node", { key: "child", value: "<p>Changed</p>" });
    expect(api.updateTreeNode).toHaveBeenCalledWith({
      key: "child",
      title: "{{content}}",
      value: "<p>Changed</p>",
    });
  });

  it("delete_node does nothing when the user declines", async () => {
    const { call, options } = setup({ confirm: vi.fn(() => Promise.resolve(false)) });
    const result = await call("delete_node", { key: "child" });
    expect(options.confirm).toHaveBeenCalled();
    expect(api.deleteTreeNode).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: "The user declined this deletion" });
  });

  it("delete_node deletes after confirmation", async () => {
    const { call } = setup();
    await call("delete_node", { key: "child" });
    expect(api.deleteTreeNode).toHaveBeenCalledWith({ key: "child" });
  });

  it("returns backend errors to the model instead of throwing", async () => {
    vi.mocked(api.addTreeNode).mockRejectedValueOnce({
      response: { data: { error: { code: "NOT_FOUND", message: "Parent not found" } } },
    });
    const { call, options } = setup();
    const result = await call("add_html_node", { parentKey: "root", title: "{{footer}}", value: "" });
    expect(result).toEqual({ ok: false, error: "Parent not found" });
    expect(options.onChange).not.toHaveBeenCalled();
    expect(options.onToolEvent).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, summary: "Parent not found" })
    );
  });

  it("create_root refuses when a root already exists", async () => {
    const { call } = setup();
    const result = await call("create_root", { value: "<table></table>" });
    expect(result).toMatchObject({ ok: false });
    expect(api.saveTree).not.toHaveBeenCalled();
  });

  it("generate returns the link", async () => {
    const { call } = setup();
    expect(await call("generate", {})).toEqual({
      ok: true,
      url: "http://localhost:9000/template.html",
    });
  });
});
