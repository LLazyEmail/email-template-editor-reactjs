import { notification } from "antd";
import { errorMessage } from "../../api/errors";

/** Returns a `.catch` handler that shows a failed backend call to the user instead of dropping it. */
export const notifyError = (title: string) => (error: unknown) => {
  notification.error({ title, description: errorMessage(error) });
};
