import { TemplateTree } from "../../../types";

export interface TemplateTreeProps {
  treeData: Record<string, string | object>[];
  refresh: () => void;
}

export interface ModalState {
  isOpen: boolean;
  data: TemplateTree | null;
}

export interface AddElementFormValues {
  currentItemKey: string;
  values: {
    title: string;
    value?: string;
    type: "element" | "html";
    elementId?: string;
    children: Record<string, string | undefined>;
  };
  element: {
    key: string;
    title: string;
    value: string;
    children: [];
  };
}
