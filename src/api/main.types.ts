import { TemplateTree } from "../types";

export interface Generate {
  treeData: TemplateTree[];
}

export interface SaveTree {
  treeData: [{ title: string; key: string; value: string; children: [] }];
}

export interface UpdateTreeNode {
  value: string;
  title: string;
  key: string;
}

export interface AddTreeNode {
  parentKey: string;
  item: { title: string; key: string; value: string; children: object[] };
}

export interface DeleteTreeNode {
  key: string;
}

export interface AddElement{
  value: string;
  title: string;
  key: string;
}

export interface Element{
  value: string;
  title: string;
  key: string;
}