import { TemplateTree } from "../../types";

export interface TemplateTreeProps {
  treeData: Record<string, string | object>[];
  refresh: () => void;
}

export interface ModalState {
  isOpen: boolean;
  data: TemplateTree | null;
}
