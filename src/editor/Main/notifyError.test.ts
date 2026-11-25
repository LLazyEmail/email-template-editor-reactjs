import { notification } from "antd";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyError } from "./notifyError";

describe("notifyError", () => {
  beforeEach(() => {
    vi.spyOn(notification, "error").mockImplementation(() => {});
  });

  it("shows the title and the backend message", () => {
    const error = Object.assign(new Error("Request failed"), {
      response: { data: { error: { message: "title is required" } } },
    });

    notifyError("Could not add the element")(error);

    expect(notification.error).toHaveBeenCalledWith({
      title: "Could not add the element",
      description: "title is required",
    });
  });

  it("falls back to the plain error message", () => {
    notifyError("Could not load the elements")(new Error("Network Error"));

    expect(notification.error).toHaveBeenCalledWith({
      title: "Could not load the elements",
      description: "Network Error",
    });
  });
});
