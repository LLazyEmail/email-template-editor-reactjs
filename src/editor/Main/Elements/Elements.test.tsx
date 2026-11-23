import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { notification } from "antd";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addElement, deleteElement, getAllElements, updateElement } from "@/api/main";
import Elements from "./Elements";

vi.mock("@/api/main", () => ({
  getAllElements: vi.fn(),
  addElement: vi.fn(() => Promise.resolve({})),
  updateElement: vi.fn(() => Promise.resolve({})),
  deleteElement: vi.fn(() => Promise.resolve({})),
}));

const header = { key: "e1", title: "Header", value: "<h1>{{title}}</h1>" };

beforeEach(() => {
  vi.clearAllMocks();
  notification.destroy();
  vi.mocked(getAllElements).mockResolvedValue([header]);
});

describe("Elements", () => {
  it("lists the elements from the backend", async () => {
    render(<Elements />);

    expect(await screen.findByText("Header")).toBeInTheDocument();
    expect(getAllElements).toHaveBeenCalledTimes(1);
  });

  it("reloads the list when refreshKey changes", async () => {
    const { rerender } = render(<Elements refreshKey={0} />);
    await screen.findByText("Header");

    rerender(<Elements refreshKey={1} />);

    await waitFor(() => expect(getAllElements).toHaveBeenCalledTimes(2));
  });

  it("adds an element from the modal and reloads the list", async () => {
    const user = userEvent.setup();
    render(<Elements />);
    await screen.findByText("Header");

    await user.click(screen.getByRole("button", { name: "Add element" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Title"), "Footer");
    await user.type(within(dialog).getByLabelText("Value"), "<p>bye</p>");
    await user.click(within(dialog).getByRole("button", { name: "Submit" }));

    await waitFor(() =>
      expect(addElement).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Footer", value: "<p>bye</p>" }),
      ),
    );
    await waitFor(() => expect(getAllElements).toHaveBeenCalledTimes(2));
  });

  it("edits an element with its key", async () => {
    const user = userEvent.setup();
    render(<Elements />);
    await screen.findByText("Header");

    await user.click(screen.getByRole("button", { name: "edit" }));
    const dialog = await screen.findByRole("dialog");
    const title = within(dialog).getByLabelText("Title");
    expect(title).toHaveValue("Header");
    await user.clear(title);
    await user.type(title, "Big header");
    await user.click(within(dialog).getByRole("button", { name: "Submit" }));

    await waitFor(() =>
      expect(updateElement).toHaveBeenCalledWith({
        key: "e1",
        title: "Big header",
        value: header.value,
      }),
    );
  });

  it("deletes an element and reloads the list", async () => {
    const user = userEvent.setup();
    render(<Elements />);
    await screen.findByText("Header");

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteElement).toHaveBeenCalledWith({ key: "e1" });
    await waitFor(() => expect(getAllElements).toHaveBeenCalledTimes(2));
  });

  it("shows why the list could not be loaded and keeps the screen usable", async () => {
    vi.mocked(getAllElements).mockRejectedValue(new Error("Network Error"));
    render(<Elements />);

    expect(await screen.findByText("Could not load the elements")).toBeInTheDocument();
    expect(screen.getByText("Network Error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add element" })).toBeInTheDocument();
  });

  it("keeps the add modal open with the backend's message when adding fails", async () => {
    vi.mocked(addElement).mockRejectedValueOnce({
      response: { data: { error: { code: "VALIDATION", message: "title is required" } } },
    });
    const user = userEvent.setup();
    render(<Elements />);
    await screen.findByText("Header");

    await user.click(screen.getByRole("button", { name: "Add element" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Title"), "Footer");
    await user.type(within(dialog).getByLabelText("Value"), "<p>bye</p>");
    await user.click(within(dialog).getByRole("button", { name: "Submit" }));

    expect(await screen.findByText("Could not add the element")).toBeInTheDocument();
    expect(screen.getByText("title is required")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(getAllElements).toHaveBeenCalledTimes(1);
  });
});
