"use client";

import { Empty } from "antd";
import React, { useMemo } from "react";
import { renderTemplate, type PreviewNode } from "./renderTemplate";

interface PreviewProps {
  tree: PreviewNode[];
}

/**
 * Shows the email the current tree renders to.
 *
 * The HTML is untrusted (users and the AI assistant write it), so it goes into a fully
 * sandboxed iframe: no scripts, forms, popups or top-level navigation, and an opaque origin
 * that cannot read the editor's storage (where the AI API key lives).
 */
const Preview = ({ tree }: PreviewProps) => {
  const html = useMemo(() => renderTemplate(tree), [tree]);

  if (tree.length === 0) {
    return <Empty description="Add a root element to see the preview" />;
  }

  return (
    <iframe
      className="preview-frame"
      title="Email preview"
      sandbox=""
      referrerPolicy="no-referrer"
      srcDoc={html}
    />
  );
};

export default Preview;
