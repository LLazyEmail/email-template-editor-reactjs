import { AddTreeNode } from "../../../api/main.types";

/** Placeholders look like `{{name}}`; a child node's title fills the matching slot in its parent's HTML. */
const PLACEHOLDER_REGEXP = /{{[A-Za-z0-9]*}}/g;

/** Unique placeholders in `html`, in order of first appearance. */
export const extractPlaceholders = (html: string): string[] =>
  Array.from(new Set(html.match(PLACEHOLDER_REGEXP) ?? []));

/**
 * `crypto.randomUUID` only exists in secure contexts (https / localhost),
 * so fall back to a time + random key when the editor is served over plain http.
 */
export const createNodeKey = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

interface BuildHtmlNodeParams {
  parentKey: string;
  title: string;
  value: string;
}

/** A leaf node holding raw HTML. */
export const buildHtmlNode = ({
  parentKey,
  title,
  value,
}: BuildHtmlNodeParams): AddTreeNode => ({
  parentKey,
  item: { key: createNodeKey(), title, value, children: [] },
});

interface BuildElementNodeParams {
  parentKey: string;
  title: string;
  /** HTML of the element from the library; its placeholders become child nodes. */
  elementValue: string;
  /** Value for each placeholder, keyed by the placeholder itself (e.g. `{{title}}`). */
  fills?: Record<string, string | undefined>;
}

/** A node built from a library element: one child per placeholder in the element HTML. */
export const buildElementNode = ({
  parentKey,
  title,
  elementValue,
  fills = {},
}: BuildElementNodeParams): AddTreeNode => ({
  parentKey,
  item: {
    key: createNodeKey(),
    title,
    value: elementValue,
    children: extractPlaceholders(elementValue).map((placeholder) => ({
      key: createNodeKey(),
      title: placeholder,
      value: fills[placeholder] ?? "",
      children: [],
    })),
  },
});
