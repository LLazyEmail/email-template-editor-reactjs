import { TemplateTree } from "../../../types";
import { Element } from "../../../api/main.types";

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
  /** The library element picked for `type: "element"`; missing when none was found. */
  element?: Element | null;
}
