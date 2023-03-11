import { TemplateTree } from "./../../../types";

export interface AddElementFormProps {
  onSubmit: (values: any) => void;
  onCancel: () => void;
  data: TemplateTree;
}

export interface ModalState {
  isOpen: boolean;
  data: TemplateTree | null;
}
