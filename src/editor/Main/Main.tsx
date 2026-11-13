"use client";

import { Button, Collapse, Modal, Skeleton, Typography, notification } from "antd";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { saveTree, getTree, generate } from "../../api/main";
import { SaveTree } from "../../api/main.types";
import TemplateTree from "./TemplateTree/TemplateTree";
import { TemplateTree as TemplateTreeType } from "../../types";
import AddRootElementForm from "./AddRootElementForm/AddRootElementForm";
import Elements from "./Elements/Elements";
import Preview from "./Preview/Preview";
import type { PreviewNode } from "./Preview/renderTemplate";
import type { ChangedResource } from "../../ai/tools";
import "./Main.css";

// Loaded after the page so the AI SDK is not part of the initial page bundle.
const ChatPanel = dynamic(() => import("./Chat/ChatPanel"), {
  ssr: false,
  loading: () => <Skeleton active />,
});

const Home = () => {
  const [templateTree, setTemplateTree] = useState<TemplateTreeType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedTemplateLink, setGeneratedTemplateLink] = useState("");
  const [elementsVersion, setElementsVersion] = useState(0);

  console.log("templateTree", templateTree);

  const getTreeData = () => {
    getTree().then((data) => {
      setTemplateTree(data);
    });
  };

  useEffect(() => {
    getTreeData();
  }, []);

  const onHandleGenerate = () => {
    generate().then((link) => {
      notification.success({ message: "Generated successfully" });
      setGeneratedTemplateLink(link);
    });
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const onSubmit = (values: any) => {
    console.log("values", values);
    const root: SaveTree["treeData"] = [
      { title: "root", key: "1", value: values.value, children: [] },
    ];

    saveTree({ treeData: root }).then(() => {
      setIsModalOpen(false);
      getTreeData();
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onAssistantChange = (resource: ChangedResource) => {
    if (resource === "tree") getTreeData();
    else setElementsVersion((version) => version + 1);
  };

  const onOpenLink = () => {
    window.open(generatedTemplateLink, "_blank")?.focus();
  };

  return (
    <div className="editor">
      <header className="editor-toolbar">
        <Button
          disabled={Boolean(templateTree.length)}
          onClick={showModal}
          type="primary"
        >
          Add root element
        </Button>
        <Button onClick={onHandleGenerate} type="primary">
          Generate
        </Button>
        <Typography.Link onClick={onOpenLink}>
          {generatedTemplateLink}
        </Typography.Link>
      </header>
      <Modal
        title="Add root element"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <AddRootElementForm onSubmit={onSubmit} onCancel={handleCancel} />
      </Modal>

      <div className="editor-workspace">
        <aside className="editor-chat" aria-label="AI assistant">
          <Typography.Title level={5}>AI assistant</Typography.Title>
          <div className="editor-chat-body">
            <ChatPanel onChange={onAssistantChange} />
          </div>
        </aside>

        <main className="editor-main">
          <section aria-label="Preview">
            {/* GET /tree returns TreeNode[]; the shared TemplateTree type is a loose record. */}
            <Preview tree={templateTree as unknown as PreviewNode[]} />
          </section>

          {/* Manual editing: collapsed by default, panels render on first open. */}
          <Collapse>
            <Collapse.Panel key="tree" header="Template tree">
              <TemplateTree treeData={templateTree} refresh={getTreeData} />
            </Collapse.Panel>
            <Collapse.Panel key="elements" header="Elements">
              <Elements refreshKey={elementsVersion} />
            </Collapse.Panel>
          </Collapse>
        </main>
      </div>
    </div>
  );
};

export default Home;
