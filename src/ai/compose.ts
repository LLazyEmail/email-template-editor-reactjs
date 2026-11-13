import type { Element, TreeNodeData } from "../api/main.types";
import { buildElementItem, extractPlaceholders } from "../editor/Main/TemplateTree/nodeBuilders";

/**
 * Building an email from library elements in one step: validate every block first, then return
 * the changed parent node. Pure functions; the compose_blocks tool loads the data and saves the tree.
 */

export interface NestedBlockInput {
  elementKey: string;
  fills?: Record<string, string>;
}

export interface BlockInput extends NestedBlockInput {
  /** Another element placed into one of this element's placeholders, e.g. a card in a column. */
  slots?: Record<string, NestedBlockInput>;
}

export interface ComposeInput {
  blocks: BlockInput[];
  /** Placeholder in the parent after which the blocks go. Defaults to the last one in its HTML. */
  after?: string;
  /** Remove the parent's current children and put the blocks where the first of them was. */
  replace?: boolean;
}

export interface AddedBlock {
  key: string;
  title: string;
  elementKey: string;
}

export type ComposeResult =
  | {
      ok: true;
      parent: TreeNodeData;
      added: AddedBlock[];
      /** Children of the parent removed by `replace`. */
      removedCount: number;
      /** Element placeholders left empty, e.g. `blocks[2] {{item2}}`; they render as nothing. */
      unfilled: string[];
    }
  | { ok: false; errors: string[] };

const ANY_PLACEHOLDER = /{{[A-Za-z0-9]*}}/;

const countOccurrences = (text: string, part: string) => text.split(part).length - 1;

/** Accepts "title" as well as "{{title}}": models sometimes drop the braces. */
const asPlaceholder = (name: string) => (name.startsWith("{{") ? name : `{{${name}}}`);

const normalizeKeys = <T>(record: Record<string, T> = {}): Record<string, T> =>
  Object.fromEntries(Object.entries(record).map(([name, value]) => [asPlaceholder(name), value]));

/** The placeholder that appears last in `html`, i.e. the end of the content area. */
function lastPlaceholder(html: string): string | undefined {
  let last: string | undefined;
  for (const placeholder of extractPlaceholders(html)) {
    if (!last || html.lastIndexOf(placeholder) > html.lastIndexOf(last)) last = placeholder;
  }
  return last;
}

/** Errors for one element's fills (and slots), prefixed with `path` so the model knows where. */
function checkElementInput(
  path: string,
  element: Element,
  fills: Record<string, string>,
  slots: Record<string, unknown>
): string[] {
  const errors: string[] = [];
  const placeholders = extractPlaceholders(element.value);
  const describe = `element "${element.title}" (key ${element.key})`;
  const available = placeholders.length ? placeholders.join(", ") : "none";
  for (const name of Object.keys(fills)) {
    if (!placeholders.includes(name)) {
      errors.push(
        `${path}.fills: ${name} is not a placeholder of ${describe}. Its placeholders: ${available}`
      );
    }
    const nested = fills[name].match(ANY_PLACEHOLDER);
    if (nested) {
      errors.push(`${path}.fills["${name}"]: text must not contain placeholders like ${nested[0]}`);
    }
  }
  for (const name of Object.keys(slots)) {
    if (!placeholders.includes(name)) {
      errors.push(
        `${path}.slots: ${name} is not a placeholder of ${describe}. Its placeholders: ${available}`
      );
    }
    if (name in fills) errors.push(`${path}: ${name} is in both fills and slots; use one`);
  }
  return errors;
}

const isEmpty = (value: string | undefined) => !value?.trim();

/**
 * Adds `input.blocks`, in order, under `parent`. Each block gets a new placeholder in the parent's
 * HTML (`{{block1}}`, …) right after the anchor, so the model never has to manage slots itself.
 * Returns every validation error at once and changes nothing if there is any.
 */
export function composeBlocks(
  parent: TreeNodeData,
  elements: Element[],
  input: ComposeInput
): ComposeResult {
  const errors: string[] = [];
  const byKey = new Map(elements.map((element) => [element.key, element]));
  const findElement = (path: string, key: string) => {
    const element = byKey.get(key);
    if (!element) {
      errors.push(
        `${path}: element "${key}" not found. Library keys: ${Array.from(byKey.keys()).join(", ") || "none"}`
      );
    }
    return element;
  };

  const blocks = input.blocks.map((block, index) => {
    const path = `blocks[${index}]`;
    const fills = normalizeKeys(block.fills);
    const slotInputs = normalizeKeys(block.slots);
    const element = findElement(path, block.elementKey);
    if (element) errors.push(...checkElementInput(path, element, fills, slotInputs));
    const slots = Object.entries(slotInputs).map(([name, nested]) => {
      const nestedPath = `${path}.slots["${name}"]`;
      const nestedFills = normalizeKeys(nested.fills);
      const nestedElement = findElement(nestedPath, nested.elementKey);
      if (nestedElement)
        errors.push(...checkElementInput(nestedPath, nestedElement, nestedFills, {}));
      return { name, element: nestedElement, fills: nestedFills };
    });
    return { path, element, fills, slots };
  });

  // Where the new placeholders go: `marker` stands in for them until their names are known.
  const marker = "\u0000blocks\u0000";
  let html = parent.value;
  let children = parent.children ?? [];
  let reusedAnchor: string | undefined;
  const removedCount = input.replace ? children.length : 0;

  const occupied = input.replace
    ? Array.from(new Set(children.map((child) => child.title))).filter((title) =>
        html.includes(title)
      )
    : [];
  if (input.replace) {
    if (input.after) errors.push("Pass either `after` or `replace`, not both");
    children = [];
  }

  if (occupied.length) {
    // The new blocks take the place of the first removed one; the other removed slots disappear.
    const first = occupied.reduce((a, b) => (html.indexOf(a) <= html.indexOf(b) ? a : b));
    html = html.replace(first, () => marker);
    for (const title of occupied) html = html.split(title).join("");
  } else {
    const anchor = input.after ? asPlaceholder(input.after) : lastPlaceholder(html);
    if (!anchor) {
      errors.push(
        `Node "${parent.title}" (key ${parent.key}) has no placeholder to add blocks after. ` +
          `Insert one with edit_node_text first, e.g. {{content}}.`
      );
    } else if (!html.includes(anchor)) {
      errors.push(
        `Node "${parent.title}" (key ${parent.key}) has no ${anchor} placeholder. ` +
          `Its placeholders: ${extractPlaceholders(html).join(", ") || "none"}`
      );
    } else {
      const end = html.lastIndexOf(anchor) + anchor.length;
      html = `${html.slice(0, end)}${marker}${html.slice(end)}`;
      // A single, empty anchor (e.g. {{content}} of a new root) is filled by the first block.
      const anchorFree =
        countOccurrences(html, anchor) === 1 && !children.some((child) => child.title === anchor);
      if (anchorFree) reusedAnchor = anchor;
    }
  }

  if (errors.length) return { ok: false, errors };

  const taken = new Set([...extractPlaceholders(html), ...children.map((child) => child.title)]);
  let counter = 0;
  const nextName = () => {
    let name: string;
    do name = `{{block${++counter}}}`;
    while (taken.has(name));
    taken.add(name);
    return name;
  };
  const titles = blocks.map((_, index) =>
    index === 0 && reusedAnchor ? reusedAnchor : nextName()
  );
  const newPlaceholders = titles.filter((title) => title !== reusedAnchor);
  html = html.replace(marker, () => newPlaceholders.map((title) => `\n${title}`).join(""));

  const unfilled: string[] = [];
  const nodes = blocks.map(({ path, element, fills, slots }, index) => {
    // Validation passed, so every element was found.
    const value = element!.value;
    const slotNodes = Object.fromEntries(
      slots.map(({ name, element: nested, fills: nestedFills }) => {
        for (const placeholder of extractPlaceholders(nested!.value)) {
          if (isEmpty(nestedFills[placeholder])) unfilled.push(`${path} ${name} → ${placeholder}`);
        }
        return [
          name,
          buildElementItem({ title: name, elementValue: nested!.value, fills: nestedFills }),
        ];
      })
    );
    for (const placeholder of extractPlaceholders(value)) {
      if (!(placeholder in slotNodes) && isEmpty(fills[placeholder])) {
        unfilled.push(`${path} ${placeholder}`);
      }
    }
    return buildElementItem({ title: titles[index], elementValue: value, fills, slots: slotNodes });
  });

  return {
    ok: true,
    parent: { ...parent, value: html, children: [...children, ...nodes] },
    added: nodes.map((node, index) => ({
      key: node.key,
      title: node.title,
      elementKey: input.blocks[index].elementKey,
    })),
    removedCount,
    unfilled,
  };
}

/** A copy of `nodes` with the node whose key matches `node.key` swapped for `node`. */
export function replaceNode(nodes: TreeNodeData[], node: TreeNodeData): TreeNodeData[] {
  return nodes.map((current) =>
    current.key === node.key
      ? node
      : current.children
        ? { ...current, children: replaceNode(current.children, node) }
        : current
  );
}
