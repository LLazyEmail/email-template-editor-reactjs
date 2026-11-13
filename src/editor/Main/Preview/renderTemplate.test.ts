import { describe, expect, it } from "vitest";
import { renderTemplate, type PreviewNode } from "./renderTemplate";

describe("renderTemplate", () => {
  it("returns an empty string for an empty tree", () => {
    expect(renderTemplate([])).toBe("");
  });

  it("returns the root value when the root has no children", () => {
    expect(renderTemplate([{ title: "root", value: "<p>hi</p>" }])).toBe("<p>hi</p>");
  });

  it("substitutes nested children into their parents' placeholders", () => {
    const tree: PreviewNode[] = [
      {
        title: "root",
        value: "<body>{{header}}{{content}}</body>",
        children: [
          { title: "{{header}}", value: "<h1>Hi</h1>" },
          {
            title: "{{content}}",
            value: "<div>{{item}}</div>",
            children: [{ title: "{{item}}", value: "<p>Item</p>" }],
          },
        ],
      },
    ];
    expect(renderTemplate(tree)).toBe("<body><h1>Hi</h1><div><p>Item</p></div></body>");
  });

  it("replaces only the first occurrence of a placeholder", () => {
    const tree: PreviewNode[] = [
      { title: "root", value: "{{x}}-{{x}}", children: [{ title: "{{x}}", value: "X" }] },
    ];
    expect(renderTemplate(tree)).toBe("X-{{x}}");
  });

  it("inserts values literally, without expanding $ replacement patterns", () => {
    const tree: PreviewNode[] = [
      {
        title: "root",
        value: "<p>{{price}}</p>",
        children: [{ title: "{{price}}", value: "$$5 $&" }],
      },
    ];
    expect(renderTemplate(tree)).toBe("<p>$$5 $&</p>");
  });
});
