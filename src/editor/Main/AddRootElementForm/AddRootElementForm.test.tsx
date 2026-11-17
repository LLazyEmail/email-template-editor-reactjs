import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AddRootElementForm from "./AddRootElementForm";

describe("AddRootElementForm", () => {
  it("submits the root HTML", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddRootElementForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Value"), "<table>root</table>");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ value: "<table>root</table>" }));
  });

  it("does not submit without a value", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddRootElementForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText(/required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<AddRootElementForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
  });
});
