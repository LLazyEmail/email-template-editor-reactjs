export interface PreviewNode {
  title: string;
  value: string;
  children?: PreviewNode[];
}

/**
 * Renders the template tree into HTML, the same way the backend's `POST /generate` does
 * (email-template-editor-nodejs: src/modules/generate/generate-html.ts — keep the two in sync):
 * each child's `title` placeholder (e.g. `{{items}}`) inside its parent's `value` is replaced
 * (first occurrence) by the child's rendered value.
 *
 * Rendering here instead of calling the backend lets the preview update instantly and
 * without overwriting the generated file.
 */
export function renderTemplate(tree: PreviewNode[]): string {
  const root = tree[0];
  return root ? render(root) : "";
}

function render(node: PreviewNode): string {
  let html = node.value ?? "";
  for (const child of node.children ?? []) {
    const rendered = render(child);
    // Replacer function: inserts `rendered` literally, so `$&`, `$$` etc. in HTML are not expanded.
    html = html.replace(child.title, () => rendered);
  }
  return html;
}
