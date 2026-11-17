import { TemplateTree } from "../../../../types";
import { UpdateTreeNode } from "../../../../api/main.types";

export interface EditElementFormProps {
  onSubmit: (values: UpdateTreeNode) => void;
  onCancel: () => void;
  data: TemplateTree;
}
