import { Tree } from "antd";
// import type { DataNode, TreeProps } from "antd/es/tree";
import React from "react";
import { TemplateTreeProps } from "./TemplateTree.types";

const TemplateTree = (props: TemplateTreeProps) => {
  return <Tree defaultExpandAll treeData={props.treeData} />;
};

export default TemplateTree;
