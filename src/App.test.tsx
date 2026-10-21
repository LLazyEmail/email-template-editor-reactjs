import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";

vi.mock("./api/main", () => ({
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

test("renders the app without crashing", async () => {
  render(<App />);
  expect(await screen.findByText(/Add root element/i)).toBeInTheDocument();
  expect(screen.getByText(/Generate/i)).toBeInTheDocument();
});
