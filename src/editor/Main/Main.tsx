"use client";

import { Button, Drawer, Modal, Typography, notification } from "antd";
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

// Loaded on first open so the AI SDK is not part of the initial page bundle.
const ChatPanel = dynamic(() => import("./Chat/ChatPanel"), { ssr: false });

const Home = () => {
  const [templateTree, setTemplateTree] = useState<TemplateTreeType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedTemplateLink, setGeneratedTemplateLink] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
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
    <div className="container">
      <div>
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
        <Button onClick={() => setIsChatOpen(true)}>AI assistant</Button>
        <Typography.Link onClick={onOpenLink}>
          {generatedTemplateLink}
        </Typography.Link>
      </div>
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
      <div className="editor-layout">
        <div className="editor-tree">
          <TemplateTree treeData={templateTree} refresh={getTreeData} />
        </div>
        <section className="editor-preview" aria-label="Preview">
          <Typography.Title level={5}>Preview</Typography.Title>
          {/* GET /tree returns TreeNode[]; the shared TemplateTree type is a loose record. */}
          <Preview tree={templateTree as unknown as PreviewNode[]} />
        </section>
      </div>

      <Elements refreshKey={elementsVersion} />

      <Drawer
        title="AI assistant"
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        width={440}
        mask={false}
      >
        <ChatPanel onChange={onAssistantChange} />
      </Drawer>
    </div>
  );
};

export default Home;
