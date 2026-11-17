import { Element } from "../../../../api/main.types";

export interface AddElementFormProps {
  onSubmit: (values: Omit<Element, "key">) => void;
  onCancel: () => void;
}
