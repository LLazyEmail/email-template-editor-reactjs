import { Element } from "../../../../api/main.types";

export interface EditElementFormProps {
  onSubmit: (values: Element) => void;
  onCancel: () => void;
  data: Element;
}

export interface ModalState {
  isOpen: boolean;
  data: Element | null;
}
