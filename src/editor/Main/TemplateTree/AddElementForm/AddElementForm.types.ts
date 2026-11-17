import { TemplateTree } from "../../../../types";
import { AddElementFormValues } from "../TemplateTree.types";

export interface AddElementFormProps {
  onSubmit: (values: AddElementFormValues) => void;
  onCancel: () => void;
  data: TemplateTree;
}
