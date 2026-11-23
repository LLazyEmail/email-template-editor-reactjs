import { describe, expect, it } from "vitest";
import { errorMessage } from "./errors";

describe("errorMessage", () => {
  it("prefers the backend's error message", () => {
    const error = Object.assign(new Error("Request failed with status code 404"), {
      response: { data: { error: { code: "NOT_FOUND", message: "Element e1 not found" } } },
    });

    expect(errorMessage(error)).toBe("Element e1 not found");
  });

  it("ignores a non-string message from the backend and falls back", () => {
    const error = Object.assign(new Error("Request failed"), {
      response: { data: { error: { message: 404 } } },
    });

    expect(errorMessage(error)).toBe("Request failed");
  });

  it("falls back when the response has no error.message", () => {
    const error = Object.assign(new Error("Network Error"), {
      response: { data: { error: { code: "UNKNOWN" } } },
    });

    expect(errorMessage(error)).toBe("Network Error");
  });

  it("falls back to the error's own message", () => {
    expect(errorMessage(new Error("Network Error"))).toBe("Network Error");
  });

  it("stringifies anything that is not an Error", () => {
    expect(errorMessage("boom")).toBe("boom");
    expect(errorMessage(null)).toBe("null");
    expect(errorMessage(undefined)).toBe("undefined");
  });
});
