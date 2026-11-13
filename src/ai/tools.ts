import { tool, type ToolSet } from "ai";
import { z } from "zod";
import {
  addElement,
  addTreeNode,
  deleteElement,
  deleteTreeNode,
  generate,
  getAllElements,
  getTree,
  saveTree,
  updateElement,
  updateTreeNode,
} from "../api/main";
import type { Element } from "../api/main.types";
import { composeBlocks, replaceNode } from "./compose";
import {
  buildElementNode,
  buildHtmlNode,
  createNodeKey,
  extractPlaceholders,
} from "../editor/Main/TemplateTree/nodeBuilders";

export interface TreeNode {
  key: string;
  title: string;
  value: string;
  children?: TreeNode[];
}

export type ChangedResource = "tree" | "elements";

export interface ToolEvent {
  toolName: string;
  input: unknown;
  ok: boolean;
  /** Short human-readable outcome shown in the chat. */
  summary: string;
}

export interface EditorToolsOptions {
  /** Asks the user before a destructive action. Resolve `false` to cancel it. */
  confirm: (message: string) => Promise<boolean>;
  /** Called after a successful change so the UI can reload that data. */
  onChange: (resource: ChangedResource) => void;
  /** Called after every tool call, for the activity log in the chat. */
  onToolEvent?: (event: ToolEvent) => void;
}

const PREVIEW_LENGTH = 120;
/** Nodes larger than this are returned as snippets, not whole: the root alone can be ~180 KB of HTML. */
const FULL_VALUE_LIMIT = 20_000;
const SNIPPET_RADIUS = 200;
const MAX_SNIPPETS = 5;

type ToolResult = { ok: true; [key: string]: unknown } | { ok: false; error: string };

/** Pulls the backend's `{ error: { message } }` out of an axios error, else the plain message. */
export function errorMessage(error: unknown): string {
  const apiMessage = (error as { response?: { data?: { error?: { message?: unknown } } } })
    ?.response?.data?.error?.message;
  if (typeof apiMessage === "string") return apiMessage;
  return error instanceof Error ? error.message : String(error);
}

const countOccurrences = (text: string, part: string) =>
  part ? text.split(part).length - 1 : 0;

/**
 * Generation replaces the first occurrence of each child's title in the parent's HTML, in order.
 * So a placeholder that appears N times can hold N children; any extra child is silently dropped.
 */
export function freePlaceholders(node: TreeNode): string[] {
  const children = node.children ?? [];
  return extractPlaceholders(node.value).filter(
    (placeholder) =>
      countOccurrences(node.value, placeholder) >
      children.filter((child) => child.title === placeholder).length
  );
}

/** Keys of children that will not appear in the generated HTML (no matching slot left in the parent). */
function unrenderedChildKeys(parent: TreeNode): Set<string> {
  const used = new Map<string, number>();
  const result = new Set<string>();
  for (const child of parent.children ?? []) {
    const index = used.get(child.title) ?? 0;
    used.set(child.title, index + 1);
    if (index >= countOccurrences(parent.value, child.title)) result.add(child.key);
  }
  return result;
}

function outline(node: TreeNode, rendered = true): unknown {
  const hidden = unrenderedChildKeys(node);
  return {
    key: node.key,
    title: node.title,
    ...(rendered ? {} : { notRendered: true }),
    placeholders: extractPlaceholders(node.value),
    freePlaceholders: freePlaceholders(node),
    valuePreview:
      node.value.length > PREVIEW_LENGTH ? `${node.value.slice(0, PREVIEW_LENGTH)}…` : node.value,
    valueLength: node.value.length,
    children: (node.children ?? []).map((child) => outline(child, !hidden.has(child.key))),
  };
}

/** Text around each occurrence of `part` (at most MAX_SNIPPETS), so the model can see a large node locally. */
function snippetsAround(value: string, part: string): string[] {
  const snippets: string[] = [];
  let index = value.indexOf(part);
  while (index !== -1 && snippets.length < MAX_SNIPPETS) {
    snippets.push(
      value.slice(Math.max(0, index - SNIPPET_RADIUS), index + part.length + SNIPPET_RADIUS)
    );
    index = value.indexOf(part, index + part.length);
  }
  return snippets;
}

/** Why a new child with `title` would not be rendered under `parent`, or null if the slot is free. */
function slotError(parent: TreeNode, title: string): string | null {
  if (freePlaceholders(parent).includes(title)) return null;
  const free = freePlaceholders(parent);
  const reason = parent.value.includes(title)
    ? `"${title}" in node "${parent.title}" (key ${parent.key}) is already filled by another child`
    : `node "${parent.title}" (key ${parent.key}) has no "${title}" placeholder`;
  return (
    `${reason}, so the new node would not appear in the email. ` +
    `Free placeholders there: ${free.length ? free.join(", ") : "none"}. ` +
    `To add a block, first insert a new unique placeholder into the parent with edit_node_text ` +
    `(e.g. find "{{items}}", replace with "{{items}}\n{{items2}}"), then add the node with that title.`
  );
}

export function findNode(nodes: TreeNode[], key: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    const found = findNode(node.children ?? [], key);
    if (found) return found;
  }
  return undefined;
}

const keyField = z.string().min(1);
const fillsField = z
  .record(z.string(), z.string())
  .optional()
  .describe('Placeholder → text or HTML, e.g. {"{{title}}": "Hello"}');

const MAX_ELEMENTS_PER_READ = 20;
const MAX_BLOCKS = 50;

export function createEditorTools({ confirm, onChange, onToolEvent }: EditorToolsOptions): ToolSet {
  /**
   * Runs one action, turns failures into a result the model can read and recover from,
   * and reports the outcome to the chat log.
   */
  async function run(
    toolName: string,
    input: unknown,
    action: () => Promise<ToolResult>,
    describe: (result: ToolResult) => string
  ): Promise<ToolResult> {
    let result: ToolResult;
    try {
      result = await action();
    } catch (error) {
      result = { ok: false, error: errorMessage(error) };
    }
    onToolEvent?.({
      toolName,
      input,
      ok: result.ok,
      summary: result.ok ? describe(result) : result.error,
    });
    return result;
  }

  const loadTree = async () => (await getTree()) as TreeNode[];
  const loadElements = async () => (await getAllElements()) as Element[];

  return {
    get_tree: tool({
      description:
        "Get the template tree outline: key, title, a short preview of each node's HTML, and children. Call this before changing the tree.",
      inputSchema: z.object({}),
      execute: (input) =>
        run(
          "get_tree",
          input,
          async () => ({ ok: true, tree: (await loadTree()).map((node) => outline(node)) }),
          () => "Read the template tree"
        ),
    }),

    get_node: tool({
      description: `Get the HTML of one tree node. Nodes over ${FULL_VALUE_LIMIT} characters are not returned whole: you get the text around each placeholder, or around \`search\` if given (e.g. a heading you want to change).`,
      inputSchema: z.object({
        key: keyField,
        search: z.string().min(1).optional().describe("Text to find inside the node's HTML"),
      }),
      execute: (input) =>
        run(
          "get_node",
          input,
          async () => {
            const node = findNode(await loadTree(), input.key);
            if (!node) return { ok: false, error: `Node "${input.key}" not found` };
            const base = {
              key: node.key,
              title: node.title,
              valueLength: node.value.length,
              placeholders: extractPlaceholders(node.value),
              freePlaceholders: freePlaceholders(node),
              childKeys: (node.children ?? []).map((child) => child.key),
            };
            if (input.search) {
              return {
                ok: true,
                node: {
                  ...base,
                  matches: countOccurrences(node.value, input.search),
                  snippets: snippetsAround(node.value, input.search),
                },
              };
            }
            if (node.value.length <= FULL_VALUE_LIMIT) {
              return { ok: true, node: { ...base, value: node.value } };
            }
            return {
              ok: true,
              node: {
                ...base,
                truncated: true,
                snippetsAroundPlaceholders: Object.fromEntries(
                  base.placeholders.map((p) => [p, snippetsAround(node.value, p)])
                ),
              },
            };
          },
          () => `Read node ${input.key}`
        ),
    }),

    list_elements: tool({
      description:
        "List reusable elements in the library with their placeholders (e.g. {{title}}). Use an element's key with add_element_node.",
      inputSchema: z.object({}),
      execute: (input) =>
        run(
          "list_elements",
          input,
          async () => ({
            ok: true,
            elements: (await loadElements()).map((element) => ({
              key: element.key,
              title: element.title,
              placeholders: extractPlaceholders(element.value),
            })),
          }),
          () => "Read the element library"
        ),
    }),

    get_element: tool({
      description:
        "Get the full HTML of library elements by key. Pass all the keys you need in one call.",
      inputSchema: z.object({ keys: z.array(keyField).min(1).max(MAX_ELEMENTS_PER_READ) }),
      execute: (input) =>
        run(
          "get_element",
          input,
          async () => {
            const library = await loadElements();
            const missing = input.keys.filter((key) => !library.some((item) => item.key === key));
            if (missing.length) {
              return { ok: false, error: `Element(s) not found: ${missing.join(", ")}` };
            }
            return { ok: true, elements: library.filter((item) => input.keys.includes(item.key)) };
          },
          () =>
            input.keys.length === 1
              ? `Read element ${input.keys[0]}`
              : `Read ${input.keys.length} elements`
        ),
    }),

    create_root: tool({
      description:
        "Create the root node when the tree is empty. Its HTML usually contains placeholders like {{content}} that child nodes fill.",
      inputSchema: z.object({ value: z.string().describe("HTML of the root node") }),
      execute: (input) =>
        run(
          "create_root",
          input,
          async () => {
            if ((await loadTree()).length > 0) {
              return { ok: false, error: "The tree already has a root node" };
            }
            await saveTree({
              treeData: [{ title: "root", key: createNodeKey(), value: input.value, children: [] }],
            });
            onChange("tree");
            return { ok: true };
          },
          () => "Created the root node"
        ),
    }),

    add_html_node: tool({
      description:
        "Add a child node with raw HTML under a parent node. The title must be a placeholder that exists in the parent's HTML (e.g. {{content}}) so the child is rendered in that spot.",
      inputSchema: z.object({
        parentKey: keyField,
        title: z.string().min(1).describe("Placeholder in the parent HTML, e.g. {{content}}"),
        value: z.string().describe("HTML of the new node"),
      }),
      execute: (input) =>
        run(
          "add_html_node",
          input,
          async () => {
            const parent = findNode(await loadTree(), input.parentKey);
            if (!parent) return { ok: false, error: `Parent node "${input.parentKey}" not found` };
            const error = slotError(parent, input.title);
            if (error) return { ok: false, error };
            const data = buildHtmlNode(input);
            await addTreeNode(data);
            onChange("tree");
            return { ok: true, key: data.item.key };
          },
          () => `Added "${input.title}"`
        ),
    }),

    add_element_node: tool({
      description:
        "Add a node built from a library element under a parent node. Each placeholder of the element becomes a child node; pass their values in `fills`.",
      inputSchema: z.object({
        parentKey: keyField,
        elementKey: keyField,
        title: z.string().min(1).describe("Placeholder in the parent HTML this node fills"),
        fills: fillsField,
      }),
      execute: (input) =>
        run(
          "add_element_node",
          input,
          async () => {
            const parent = findNode(await loadTree(), input.parentKey);
            if (!parent) return { ok: false, error: `Parent node "${input.parentKey}" not found` };
            const error = slotError(parent, input.title);
            if (error) return { ok: false, error };
            const element = (await loadElements()).find((item) => item.key === input.elementKey);
            if (!element) return { ok: false, error: `Element "${input.elementKey}" not found` };
            const data = buildElementNode({
              parentKey: input.parentKey,
              title: input.title,
              elementValue: element.value,
              fills: input.fills,
            });
            await addTreeNode(data);
            onChange("tree");
            return { ok: true, key: data.item.key };
          },
          () => `Added element "${input.title}"`
        ),
    }),

    compose_blocks: tool({
      description:
        "Add several library elements, in order, under a parent node in one atomic change: either all blocks are added or none. " +
        "The tool inserts the placeholders into the parent itself, so do not call edit_node_text first. " +
        "Use it to build an email from text the user pasted. Every block must be a library element.",
      inputSchema: z.object({
        parentKey: keyField.optional().describe("Defaults to the root node"),
        after: z
          .string()
          .optional()
          .describe(
            "Placeholder in the parent after which the blocks go; defaults to its last placeholder"
          ),
        replace: z
          .boolean()
          .optional()
          .describe(
            "Remove the parent's current child blocks and put the new ones in their place. Only when the user asks to replace the content. The user is asked to confirm."
          ),
        blocks: z
          .array(
            z.object({
              elementKey: keyField,
              fills: fillsField,
              slots: z
                .record(z.string(), z.object({ elementKey: keyField, fills: fillsField }))
                .optional()
                .describe(
                  'Placeholder → another library element placed there, e.g. {"{{item1}}": {"elementKey": "card", "fills": {...}}} for a card in a column'
                ),
            })
          )
          .min(1)
          .max(MAX_BLOCKS),
      }),
      execute: (input) =>
        run(
          "compose_blocks",
          input,
          async () => {
            const [tree, library] = await Promise.all([loadTree(), loadElements()]);
            const parent = input.parentKey ? findNode(tree, input.parentKey) : tree[0];
            if (!parent) {
              return {
                ok: false,
                error: input.parentKey
                  ? `Parent node "${input.parentKey}" not found`
                  : "The tree is empty; create the root node first with create_root",
              };
            }
            const plan = composeBlocks(parent, library, input);
            if (!plan.ok) {
              return {
                ok: false,
                error: `Nothing was added. Fix all of these and call compose_blocks again:\n${plan.errors.join("\n")}`,
              };
            }
            if (plan.removedCount > 0) {
              const approved = await confirm(
                `Replace ${plan.removedCount} block(s) in "${parent.title}" with ${plan.added.length} new block(s)?`
              );
              if (!approved) return { ok: false, error: "The user declined replacing the blocks" };
            }
            // One PUT of the whole tree: the backend writes it atomically, so a failure leaves no half-built email.
            await saveTree({ treeData: replaceNode(tree, plan.parent) });
            onChange("tree");
            return {
              ok: true,
              parentKey: parent.key,
              added: plan.added,
              removedCount: plan.removedCount,
              unfilled: plan.unfilled,
            };
          },
          (result) => {
            const added = result.ok && Array.isArray(result.added) ? result.added.length : 0;
            const removed = result.ok ? Number(result.removedCount) : 0;
            return removed
              ? `Replaced ${removed} block(s) with ${added} new block(s)`
              : `Added ${added} block(s)`;
          }
        ),
    }),

    update_node: tool({
      description:
        "Replace the title and/or the whole HTML value of a tree node. For a small change in a large node use edit_node_text instead.",
      inputSchema: z.object({
        key: keyField,
        title: z.string().optional(),
        value: z.string().optional(),
      }),
      execute: (input) =>
        run(
          "update_node",
          input,
          async () => {
            if (input.title === undefined && input.value === undefined) {
              return { ok: false, error: "Pass a new title or value" };
            }
            const node = findNode(await loadTree(), input.key);
            if (!node) return { ok: false, error: `Node "${input.key}" not found` };
            await updateTreeNode({
              key: input.key,
              title: input.title ?? node.title,
              value: input.value ?? node.value,
            });
            onChange("tree");
            return { ok: true };
          },
          () => `Updated node ${input.key}`
        ),
    }),

    edit_node_text: tool({
      description:
        "Replace one exact piece of text in a node's HTML, without resending the whole HTML. `find` must occur exactly once (include surrounding text to make it unique). Use it to change text or to add a new placeholder, e.g. find \"{{items}}\" → replace \"{{items}}\\n{{items2}}\".",
      inputSchema: z.object({
        key: keyField,
        find: z.string().min(1),
        replace: z.string(),
      }),
      execute: (input) =>
        run(
          "edit_node_text",
          input,
          async () => {
            const node = findNode(await loadTree(), input.key);
            if (!node) return { ok: false, error: `Node "${input.key}" not found` };
            const matches = countOccurrences(node.value, input.find);
            if (matches !== 1) {
              return {
                ok: false,
                error:
                  matches === 0
                    ? `The text was not found in node ${input.key}. Use get_node with search to see the exact text.`
                    : `The text occurs ${matches} times in node ${input.key}; include more surrounding text so it is unique.`,
              };
            }
            const value = node.value.replace(input.find, () => input.replace);
            await updateTreeNode({ key: node.key, title: node.title, value });
            onChange("tree");
            return { ok: true, freePlaceholders: freePlaceholders({ ...node, value }) };
          },
          () => `Edited node ${input.key}`
        ),
    }),

    delete_node: tool({
      description: "Delete a tree node and all its children. The user is asked to confirm.",
      inputSchema: z.object({ key: keyField }),
      execute: (input) =>
        run(
          "delete_node",
          input,
          async () => {
            const node = findNode(await loadTree(), input.key);
            if (!node) return { ok: false, error: `Node "${input.key}" not found` };
            const approved = await confirm(
              `Delete node "${node.title}" and ${node.children?.length ?? 0} child node(s)?`
            );
            if (!approved) return { ok: false, error: "The user declined this deletion" };
            await deleteTreeNode({ key: input.key });
            onChange("tree");
            return { ok: true };
          },
          () => `Deleted node ${input.key}`
        ),
    }),

    create_element: tool({
      description: "Add a reusable element (an HTML snippet, may contain {{placeholders}}) to the library.",
      inputSchema: z.object({ title: z.string().min(1), value: z.string() }),
      execute: (input) =>
        run(
          "create_element",
          input,
          async () => {
            const key = createNodeKey();
            await addElement({ key, title: input.title, value: input.value });
            onChange("elements");
            return { ok: true, key };
          },
          () => `Created element "${input.title}"`
        ),
    }),

    update_element: tool({
      description: "Change the title and/or HTML of a library element.",
      inputSchema: z.object({
        key: keyField,
        title: z.string().optional(),
        value: z.string().optional(),
      }),
      execute: (input) =>
        run(
          "update_element",
          input,
          async () => {
            const element = (await loadElements()).find((item) => item.key === input.key);
            if (!element) return { ok: false, error: `Element "${input.key}" not found` };
            await updateElement({
              key: input.key,
              title: input.title ?? element.title,
              value: input.value ?? element.value,
            });
            onChange("elements");
            return { ok: true };
          },
          () => `Updated element ${input.key}`
        ),
    }),

    delete_element: tool({
      description: "Delete a library element. The user is asked to confirm.",
      inputSchema: z.object({ key: keyField }),
      execute: (input) =>
        run(
          "delete_element",
          input,
          async () => {
            const element = (await loadElements()).find((item) => item.key === input.key);
            if (!element) return { ok: false, error: `Element "${input.key}" not found` };
            const approved = await confirm(`Delete element "${element.title}" from the library?`);
            if (!approved) return { ok: false, error: "The user declined this deletion" };
            await deleteElement({ key: input.key });
            onChange("elements");
            return { ok: true };
          },
          () => `Deleted element ${input.key}`
        ),
    }),

    generate: tool({
      description: "Render the template tree to HTML and get a link to the result.",
      inputSchema: z.object({}),
      execute: (input) =>
        run(
          "generate",
          input,
          async () => ({ ok: true, url: await generate() }),
          (result) => `Generated: ${result.ok ? String(result.url) : ""}`
        ),
    }),
  };
}
