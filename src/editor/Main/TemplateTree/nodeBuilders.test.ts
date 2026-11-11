import { describe, expect, it } from "vitest";
import { buildElementNode, buildHtmlNode, createNodeKey, extractPlaceholders } from "./nodeBuilders";

describe("extractPlaceholders", () => {
  it("returns unique placeholders in order", () => {
    expect(extractPlaceholders("<td>{{title}}</td>{{body}}{{title}}")).toEqual([
      "{{title}}",
      "{{body}}",
    ]);
  });

  it("returns an empty list when there are none", () => {
    expect(extractPlaceholders("<p>plain</p>")).toEqual([]);
  });
});

describe("createNodeKey", () => {
  it("returns distinct keys", () => {
    expect(createNodeKey()).not.toEqual(createNodeKey());
  });
});

describe("buildHtmlNode", () => {
  it("builds a leaf under the parent", () => {
    const data = buildHtmlNode({ parentKey: "1", title: "{{content}}", value: "<p>Hi</p>" });
    expect(data.parentKey).toBe("1");
    expect(data.item).toMatchObject({ title: "{{content}}", value: "<p>Hi</p>", children: [] });
    expect(data.item.key).toBeTruthy();
  });
});

describe("buildElementNode", () => {
  it("creates one child per placeholder, filled from `fills`", () => {
    const data = buildElementNode({
      parentKey: "1",
      title: "{{content}}",
      elementValue: "<h1>{{title}}</h1><p>{{text}}</p>",
      fills: { "{{title}}": "Welcome" },
    });

    expect(data.item.value).toBe("<h1>{{title}}</h1><p>{{text}}</p>");
    expect(data.item.children).toMatchObject([
      { title: "{{title}}", value: "Welcome", children: [] },
      { title: "{{text}}", value: "", children: [] },
    ]);
  });
});
