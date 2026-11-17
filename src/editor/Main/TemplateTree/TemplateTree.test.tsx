import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addTreeNode, deleteTreeNode, updateTreeNode } from "@/api/main";
import TemplateTree from "./TemplateTree";

vi.mock("@/api/main", () => ({
  getAllElements: vi.fn(() => Promise.resolve([])),
  addTreeNode: vi.fn(() => Promise.resolve({})),
  updateTreeNode: vi.fn(() => Promise.resolve({})),
  deleteTreeNode: vi.fn(() => Promise.resolve({})),
}));

const treeData = [
  {
    key: "1",
    title: "root",
    value: "<table>{{intro}}</table>",
    children: [{ key: "2", title: "{{intro}}", value: "<p>Hello</p>", children: [] }],
  },
];

const openMenuOn = async (title: string, action: "Add" | "Edit" | "Delete") => {
  fireEvent.contextMenu(screen.getByText(title));
  fireEvent.click(await screen.findByText(action));
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("TemplateTree", () => {
  it("renders every node expanded", () => {
    render(<TemplateTree treeData={treeData} refresh={vi.fn()} />);

    expect(screen.getByText("root")).toBeInTheDocument();
    expect(screen.getByText("{{intro}}")).toBeInTheDocument();
  });

  it("deletes a node from its context menu and refreshes", async () => {
    const refresh = vi.fn();
    render(<TemplateTree treeData={treeData} refresh={refresh} />);

    await openMenuOn("{{intro}}", "Delete");

    expect(deleteTreeNode).toHaveBeenCalledWith({ key: "2" });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("edits a node's title and value", async () => {
    const user = userEvent.setup();
    const refresh = vi.fn();
    render(<TemplateTree treeData={treeData} refresh={refresh} />);

    await openMenuOn("{{intro}}", "Edit");
    const dialog = await screen.findByRole("dialog");
    const value = within(dialog).getByLabelText("Value");
    expect(value).toHaveValue("<p>Hello</p>");
    await user.clear(value);
    await user.type(value, "<p>Hi</p>");
    await user.click(within(dialog).getByRole("button", { name: "Submit" }));

    await waitFor(() =>
      expect(updateTreeNode).toHaveBeenCalledWith({
        key: "2",
        title: "{{intro}}",
        value: "<p>Hi</p>",
      }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("adds an HTML child node under the clicked node", async () => {
    const user = userEvent.setup();
    const refresh = vi.fn();
    render(<TemplateTree treeData={treeData} refresh={refresh} />);

    await openMenuOn("root", "Add");
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Title"), "Footer");
    await user.click(within(dialog).getAllByRole("combobox")[0]);
    await user.click(await screen.findByTitle("HTML"));
    await user.type(await within(dialog).findByLabelText("Value"), "<p>Bye</p>");
    await user.click(within(dialog).getByRole("button", { name: "Submit" }));

    await waitFor(() =>
      expect(addTreeNode).toHaveBeenCalledWith({
        parentKey: "1",
        item: expect.objectContaining({ title: "Footer", value: "<p>Bye</p>", children: [] }),
      }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
