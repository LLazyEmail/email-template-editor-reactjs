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

describe("get_element", () => {
  it("returns several elements in one call", async () => {
    vi.mocked(api.getAllElements).mockResolvedValue([
      ...elements,
      { key: "el2", title: "Text", value: "<p>{{text}}</p>" },
    ]);
    const { call } = setup();
    expect(await call("get_element", { keys: ["el1", "el2"] })).toMatchObject({
      ok: true,
      elements: [{ key: "el1" }, { key: "el2" }],
    });
  });

  it("names the keys that do not exist", async () => {
    const { call } = setup();
    expect(await call("get_element", { keys: ["el1", "nope"] })).toEqual({
      ok: false,
      error: "Element(s) not found: nope",
    });
  });
});

describe("compose_blocks", () => {
  const library = [
    { key: "text", title: "{{text}}", value: "<p>{{text}}</p>" },
    { key: "row", title: "{{twoBlocks}}", value: "<tr><td>{{item1}}</td><td>{{item2}}</td></tr>" },
    {
      key: "card",
      title: "{{card}}",
      value: '<a href="{{link}}"><img src="{{image}}"></a><b>{{title}}</b>',
    },
  ];

  const issueRoot = () => ({
    key: "root",
    title: "root",
    value: "<header/>{{items}}\n{{items2}}<footer/>",
    children: [
      { key: "a", title: "{{items}}", value: "<p>Old 1</p>", children: [] },
      { key: "b", title: "{{items2}}", value: "<p>Old 2</p>", children: [] },
    ],
  });

  const card = (title: string) => ({
    elementKey: "card",
    fills: {
      "{{link}}": `https://example.com/${title}`,
      "{{image}}": `https://img/${title}.jpg`,
      "{{title}}": title,
    },
  });

  const savedRoot = () => vi.mocked(api.saveTree).mock.calls[0][0].treeData[0];

  beforeEach(() => {
    vi.mocked(api.getTree).mockResolvedValue([issueRoot()]);
    vi.mocked(api.getAllElements).mockResolvedValue(library);
  });

  it("appends blocks in order after the last placeholder, in one save", async () => {
    const { call, options } = setup();
    const result = await call("compose_blocks", {
      blocks: [
        { elementKey: "text", fills: { "{{text}}": "This week: soups" } },
        { elementKey: "row", slots: { "{{item1}}": card("Borscht"), "{{item2}}": card("Ramen") } },
        { elementKey: "row", slots: { "{{item1}}": card("Pho") } },
      ],
    });

    expect(result).toMatchObject({
      ok: true,
      parentKey: "root",
      removedCount: 0,
      added: [
        { title: "{{block1}}", elementKey: "text" },
        { title: "{{block2}}", elementKey: "row" },
        { title: "{{block3}}", elementKey: "row" },
      ],
      unfilled: ["blocks[2] {{item2}}"],
    });
    expect(api.saveTree).toHaveBeenCalledTimes(1);
    expect(api.addTreeNode).not.toHaveBeenCalled();
    const root = savedRoot();
    expect(root.value).toBe(
      "<header/>{{items}}\n{{items2}}\n{{block1}}\n{{block2}}\n{{block3}}<footer/>"
    );
    expect(root.children!.map((child) => child.title)).toEqual([
      "{{items}}",
      "{{items2}}",
      "{{block1}}",
      "{{block2}}",
      "{{block3}}",
    ]);
    // A card sits in the row's column slot, with its own fields as leaves.
    const row = root.children![3];
    expect(row.children).toMatchObject([
      {
        title: "{{item1}}",
        value: library[2].value,
        children: [
          { title: "{{link}}", value: "https://example.com/Borscht" },
          { title: "{{image}}", value: "https://img/Borscht.jpg" },
          { title: "{{title}}", value: "Borscht" },
        ],
      },
      {
        title: "{{item2}}",
        children: expect.arrayContaining([
          expect.objectContaining({ title: "{{title}}", value: "Ramen" }),
        ]),
      },
    ]);
    expect(options.onChange).toHaveBeenCalledWith("tree");
    expect(options.onToolEvent).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, summary: "Added 3 block(s)" })
    );
  });

  it("fills a single free placeholder first, e.g. {{content}} of a new root", async () => {
    vi.mocked(api.getTree).mockResolvedValue([
      { key: "1", title: "root", value: "<table>{{content}}</table>", children: [] },
    ]);
    const { call } = setup();
    await call("compose_blocks", {
      blocks: [
        { elementKey: "text", fills: { text: "Hello" } },
        { elementKey: "text", fills: { "{{text}}": "Bye" } },
      ],
    });
    const root = savedRoot();
    expect(root.value).toBe("<table>{{content}}\n{{block1}}</table>");
    expect(root.children).toMatchObject([
      { title: "{{content}}", children: [{ title: "{{text}}", value: "Hello" }] },
      { title: "{{block1}}", children: [{ title: "{{text}}", value: "Bye" }] },
    ]);
  });

  it("adds after a given placeholder and under a given parent", async () => {
    vi.mocked(api.getTree).mockResolvedValue([
      {
        key: "root",
        title: "root",
        value: "{{main}}",
        children: [
          {
            key: "main",
            title: "{{main}}",
            value: "{{intro}}{{block1}}{{outro}}",
            children: [{ key: "x", title: "{{intro}}", value: "", children: [] }],
          },
        ],
      },
    ]);
    const { call } = setup();
    await call("compose_blocks", {
      parentKey: "main",
      after: "{{intro}}",
      blocks: [{ elementKey: "text", fills: { "{{text}}": "Hi" } }],
    });
    const main = savedRoot().children![0];
    // {{block1}} is already in the HTML, so the new placeholder gets the next free name.
    expect(main.value).toBe("{{intro}}\n{{block2}}{{block1}}{{outro}}");
    expect(main.children!.map((child) => child.title)).toEqual(["{{intro}}", "{{block2}}"]);
  });

  it("reports every invalid block at once and saves nothing", async () => {
    const { call, options } = setup();
    const result = (await call("compose_blocks", {
      blocks: [
        { elementKey: "missing" },
        { elementKey: "text", fills: { "{{body}}": "x" } },
        {
          elementKey: "row",
          slots: { "{{item1}}": { elementKey: "card", fills: { "{{title}}": "Hi {{items}}" } } },
        },
        {
          elementKey: "row",
          fills: { "{{item1}}": "a" },
          slots: { "{{item1}}": card("Pho"), "{{item3}}": card("Tea") },
        },
      ],
    })) as { ok: false; error: string };

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Nothing was added");
    expect(result.error).toContain(
      'blocks[0]: element "missing" not found. Library keys: text, row, card'
    );
    expect(result.error).toContain("blocks[1].fills: {{body}} is not a placeholder");
    expect(result.error).toContain("Its placeholders: {{text}}");
    expect(result.error).toContain(
      'blocks[2].slots["{{item1}}"].fills["{{title}}"]: text must not contain placeholders like {{items}}'
    );
    expect(result.error).toContain("blocks[3]: {{item1}} is in both fills and slots");
    expect(result.error).toContain("blocks[3].slots: {{item3}} is not a placeholder");
    expect(api.saveTree).not.toHaveBeenCalled();
    expect(options.onChange).not.toHaveBeenCalled();
  });

  it("refuses a parent without placeholders", async () => {
    vi.mocked(api.getTree).mockResolvedValue([
      { key: "1", title: "root", value: "<table></table>", children: [] },
    ]);
    const { call } = setup();
    const result = (await call("compose_blocks", {
      blocks: [{ elementKey: "text" }],
    })) as { ok: false; error: string };
    expect(result.error).toContain("has no placeholder to add blocks after");
    expect(api.saveTree).not.toHaveBeenCalled();
  });

  it("refuses when the tree is empty or the parent is unknown", async () => {
    const { call } = setup();
    expect(
      await call("compose_blocks", { parentKey: "nope", blocks: [{ elementKey: "text" }] })
    ).toEqual({ ok: false, error: 'Parent node "nope" not found' });
    vi.mocked(api.getTree).mockResolvedValue([]);
    expect(await call("compose_blocks", { blocks: [{ elementKey: "text" }] })).toMatchObject({
      ok: false,
      error: expect.stringContaining("create_root"),
    });
  });

  it("replace swaps the current blocks for the new ones after confirmation", async () => {
    const { call, options } = setup();
    const result = await call("compose_blocks", {
      replace: true,
      blocks: [
        { elementKey: "text", fills: { "{{text}}": "New intro" } },
        { elementKey: "row", slots: { "{{item1}}": card("Pho") } },
      ],
    });

    expect(options.confirm).toHaveBeenCalledWith(
      'Replace 2 block(s) in "root" with 2 new block(s)?'
    );
    expect(result).toMatchObject({ ok: true, removedCount: 2 });
    const root = savedRoot();
    expect(root.value).toBe("<header/>\n{{block1}}\n{{block2}}\n<footer/>");
    expect(root.children!.map((child) => child.title)).toEqual(["{{block1}}", "{{block2}}"]);
    expect(options.onToolEvent).toHaveBeenCalledWith(
      expect.objectContaining({ summary: "Replaced 2 block(s) with 2 new block(s)" })
    );
  });

  it("replace changes nothing when the user declines", async () => {
    const { call, options } = setup({ confirm: vi.fn(() => Promise.resolve(false)) });
    const result = await call("compose_blocks", {
      replace: true,
      blocks: [{ elementKey: "text" }],
    });
    expect(result).toEqual({ ok: false, error: "The user declined replacing the blocks" });
    expect(api.saveTree).not.toHaveBeenCalled();
    expect(options.onChange).not.toHaveBeenCalled();
  });

  it("returns a failed save to the model and reports no change", async () => {
    vi.mocked(api.saveTree).mockRejectedValueOnce({
      response: { data: { error: { code: "CONFLICT", message: "Duplicate tree node key" } } },
    });
    const { call, options } = setup();
    const result = await call("compose_blocks", { blocks: [{ elementKey: "text" }] });
    expect(result).toEqual({ ok: false, error: "Duplicate tree node key" });
    expect(options.onChange).not.toHaveBeenCalled();
  });

  it("does not modify the tree it loaded", async () => {
    const loaded = [issueRoot()];
    vi.mocked(api.getTree).mockResolvedValue(loaded);
    const { call } = setup();
    await call("compose_blocks", { blocks: [{ elementKey: "text" }] });
    expect(loaded).toEqual([issueRoot()]);
  });
});
