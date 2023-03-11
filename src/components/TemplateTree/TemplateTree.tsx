import { Tree } from "antd";
import type { DataNode, TreeProps } from "antd/es/tree";
import React from "react";
import { treeData } from "./treeData";

const TemplateTree = () => {
  return <Tree defaultExpandAll treeData={treeData} />;
};

export default TemplateTree;
