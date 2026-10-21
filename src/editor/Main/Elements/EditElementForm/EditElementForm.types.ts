import { Element } from "../../../../api/main.types";

export interface EditElementFormProps {
  onSubmit: (values: any) => void;
  onCancel: () => void;
  data: Element;
}

export interface ModalState {
  isOpen: boolean;
  data: Element | null;
}
