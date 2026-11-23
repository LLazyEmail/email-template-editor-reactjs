import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { notification } from "antd";
import { beforeEach, expect, test, vi } from "vitest";
import { generate, getTree } from "@/api/main";
import Main from "./Main";

vi.mock("@/api/main", () => ({
  getTree: vi.fn(() => Promise.resolve([])),
  generate: vi.fn(() => Promise.resolve("")),
  saveTree: vi.fn(() => Promise.resolve({})),
  getAllElements: vi.fn(() => Promise.resolve([])),
  addElement: vi.fn(() => Promise.resolve({})),
  updateElement: vi.fn(() => Promise.resolve({})),
  deleteElement: vi.fn(() => Promise.resolve({})),
  updateTreeNode: vi.fn(() => Promise.resolve({})),
  addTreeNode: vi.fn(() => Promise.resolve({})),
  deleteTreeNode: vi.fn(() => Promise.resolve({})),
}));

beforeEach(() => {
  notification.destroy();
});

test("renders the editor without crashing", async () => {
  render(<Main />);
  expect(await screen.findByText(/Add root element/i)).toBeInTheDocument();
  expect(screen.getByText(/Generate/i)).toBeInTheDocument();
});

test("shows an error when the template tree cannot be loaded", async () => {
  vi.mocked(getTree).mockRejectedValueOnce(new Error("Network Error"));
  render(<Main />);

  expect(await screen.findByText("Could not load the template tree")).toBeInTheDocument();
  expect(screen.getByText("Network Error")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add root element" })).toBeEnabled();
});

test("shows an error when generating fails", async () => {
  vi.mocked(generate).mockRejectedValueOnce({
    response: { data: { error: { code: "EMPTY_TREE", message: "The tree is empty" } } },
  });
  const user = userEvent.setup();
  render(<Main />);

  await user.click(screen.getByRole("button", { name: "Generate" }));

  expect(await screen.findByText("Could not generate the template")).toBeInTheDocument();
  expect(screen.getByText("The tree is empty")).toBeInTheDocument();
});
