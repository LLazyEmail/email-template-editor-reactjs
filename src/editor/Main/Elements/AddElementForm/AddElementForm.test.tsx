import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AddElementForm from "./AddElementForm";

describe("Elements AddElementForm", () => {
  it("submits title and value", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddElementForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Footer");
    await user.type(screen.getByLabelText("Value"), "<p>bye</p>");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ title: "Footer", value: "<p>bye</p>" }),
    );
  });

  it("does not submit without required fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddElementForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findAllByText(/required/i)).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<AddElementForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
  });

  it("resets the fields", async () => {
    const user = userEvent.setup();
    render(<AddElementForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const title = screen.getByLabelText("Title");
    await user.type(title, "Temp");
    expect(title).toHaveValue("Temp");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(title).toHaveValue("");
  });
});
