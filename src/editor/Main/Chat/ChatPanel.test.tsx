import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel from "./ChatPanel";
import { runAgent } from "../../../ai/agent";
import { clearApiKey, saveApiKey } from "../../../ai/keyStore";

vi.mock("../../../ai/agent", () => ({ runAgent: vi.fn(), MAX_STEPS: 12 }));
vi.mock("../../../api/main", () => ({}));

beforeEach(() => {
  vi.mocked(runAgent).mockReset();
});

afterEach(() => {
  clearApiKey("google");
  window.localStorage.clear();
});

describe("ChatPanel", () => {
  it("asks for an API key before the first message", async () => {
    render(<ChatPanel onChange={vi.fn()} />);
    expect(await screen.findByText("Add your API key to start")).toBeInTheDocument();
  });

  it("renders model output as text, never as HTML", async () => {
    saveApiKey("google", "test-key", "memory");
    const payload = '<img src="x" onerror="alert(1)">';
    vi.mocked(runAgent).mockResolvedValue({
      text: payload,
      hitStepLimit: false,
      responseMessages: [],
    });

    const { container } = render(<ChatPanel onChange={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Message"), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(payload)).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(runAgent).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [{ role: "user", content: "hello" }] })
    );
  });

  it("says when the assistant ran out of steps", async () => {
    saveApiKey("google", "key", "memory");
    vi.mocked(runAgent).mockResolvedValue({ text: "", hitStepLimit: true, responseMessages: [] });

    render(<ChatPanel onChange={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Message"), "build the issue");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText(
        'Stopped after 12 steps; the task may be unfinished. Send "continue" to go on.'
      )
    ).toBeInTheDocument();
  });

  it("shows provider errors", async () => {
    saveApiKey("google", "bad-key", "memory");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(runAgent).mockRejectedValue(new Error("API key not valid"));

    render(<ChatPanel onChange={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Message"), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByText("API key not valid")).toBeInTheDocument());
  });

  it("suggests another model when the provider is overloaded", async () => {
    saveApiKey("google", "key", "memory");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const overloaded = Object.assign(new Error("This model is currently experiencing high demand."), {
      statusCode: 503,
    });
    // Same shape as the AI SDK's RetryError.
    vi.mocked(runAgent).mockRejectedValue(
      Object.assign(new Error("Failed after 2 attempts."), {
        errors: [overloaded, overloaded],
        lastError: overloaded,
      })
    );

    render(<ChatPanel onChange={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Message"), "hey");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText(
        "This model is currently experiencing high demand. You can also pick another model in Settings (now: gemini-flash-latest)."
      )
    ).toBeInTheDocument();
  });
});
