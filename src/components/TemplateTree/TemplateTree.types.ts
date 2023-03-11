export interface TemplateTreeProps {
  treeData: Record<string, string | object>[];
  refresh: () => void;
}
