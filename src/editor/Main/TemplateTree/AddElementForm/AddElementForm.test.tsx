import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAllElements } from "@/api/main";
import AddElementForm from "./AddElementForm";

vi.mock("@/api/main", () => ({
  getAllElements: vi.fn(),
}));

const parent = { key: "1", title: "root", value: "<table>{{content}}</table>", children: [] };

const header = { key: "e1", title: "Header", value: "<h1>{{title}}</h1><p>{{body}}</p>" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAllElements).mockResolvedValue([header]);
});

describe("TemplateTree AddElementForm", () => {
  it("loads library elements and submits an element node with placeholder fills", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddElementForm data={parent} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await waitFor(() => expect(getAllElements).toHaveBeenCalled());

    await user.type(screen.getByLabelText("Title"), "Intro");
    await user.click(screen.getAllByRole("combobox")[0]);
    // The Element field label also has title="Element", so target the open Type option.
    const typeOption = (await screen.findAllByTitle("Element")).find((el) =>
      el.classList.contains("ant-select-item-option"),
    );
    expect(typeOption).toBeDefined();
    await user.click(typeOption!);

    await user.click(screen.getAllByRole("combobox")[1]);
    await user.click(await screen.findByTitle("Header"));

    // Title is pre-filled from the selected element
    await waitFor(() => expect(screen.getByLabelText("Title")).toHaveValue("Header"));

    const titleFill = await screen.findByLabelText("{{title}}");
    const bodyFill = screen.getByLabelText("{{body}}");
    await user.type(titleFill, "Welcome");
    await user.type(bodyFill, "Hello there");

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        currentItemKey: "1",
        element: header,
        values: expect.objectContaining({
          type: "element",
          title: "Header",
          elementKey: "e1",
          children: { "{{title}}": "Welcome", "{{body}}": "Hello there" },
        }),
      }),
    );
  });

  it("submits raw HTML when type is HTML", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddElementForm data={parent} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Footer");
    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(await screen.findByTitle("HTML"));

    await user.type(await screen.findByLabelText("Value"), "<p>bye</p>");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        currentItemKey: "1",
        element: null,
        values: expect.objectContaining({
          type: "html",
          title: "Footer",
          value: "<p>bye</p>",
        }),
      }),
    );
  });

  it("does not submit without a type", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddElementForm data={parent} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Something");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    // Type and Element are both required while type is unset, so two messages appear.
    expect(await screen.findAllByText(/required/i)).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<AddElementForm data={parent} onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
  });
});
