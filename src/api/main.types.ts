import { TemplateTree } from "../types";

export interface Generate {
  treeData: TemplateTree[];
}

export interface SaveTree {
  treeData: [{ title: string; key: string; value: string; children: [] }];
}

export interface UpdateTreeNode {
  value: string;
  key: string;
}
