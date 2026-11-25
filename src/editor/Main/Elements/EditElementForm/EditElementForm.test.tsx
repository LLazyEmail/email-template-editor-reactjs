import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EditElementForm from "./EditElementForm";

const data = { key: "e1", title: "Header", value: "<h1>{{title}}</h1>" };

describe("Elements EditElementForm", () => {
  it("fills the form from data and submits the original key", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EditElementForm data={data} onSubmit={onSubmit} onCancel={vi.fn()} />);

    const title = screen.getByLabelText("Title");
    const value = screen.getByLabelText("Value");
    expect(title).toHaveValue("Header");
    expect(value).toHaveValue("<h1>{{title}}</h1>");

    await user.clear(title);
    await user.type(title, "Big header");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        key: "e1",
        title: "Big header",
        value: "<h1>{{title}}</h1>",
      }),
    );
  });

  it("does not submit an empty title", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EditElementForm data={data} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.clear(screen.getByLabelText("Title"));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText(/required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("resets back to the original values", async () => {
    const user = userEvent.setup();
    render(<EditElementForm data={data} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const title = screen.getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Changed");
    await user.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => expect(screen.getByLabelText("Title")).toHaveValue("Header"));
  });

  it("calls onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<EditElementForm data={data} onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
  });
});
