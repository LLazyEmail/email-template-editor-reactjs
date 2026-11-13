export interface GenerateResponse {
  url: string;
}

/** A template tree node as stored by the backend. */
export interface TreeNodeData {
  key: string;
  title: string;
  value: string;
  children?: TreeNodeData[];
}

/** PUT /tree replaces the whole tree in one atomic write. */
export interface SaveTree {
  treeData: TreeNodeData[];
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

export interface AddElement {
  value: string;
  title: string;
  key: string;
}

export interface UpdateElement {
  value: string;
  title: string;
  key: string;
}

export interface DeleteElement {
  key: string;
}

export interface Element {
  value: string;
  title: string;
  key: string;
}
