import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_URL,
  addElement,
  addTreeNode,
  deleteElement,
  deleteTreeNode,
  generate,
  getAllElements,
  getTree,
  saveTree,
  updateElement,
  updateTreeNode,
} from "./main";

vi.mock("axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const http = vi.mocked(axios);

beforeEach(() => {
  vi.clearAllMocks();
  for (const method of ["get", "post", "put", "patch", "delete"] as const) {
    http[method].mockResolvedValue({ data: { ok: method } });
  }
});

describe("api client", () => {
  it("talks to the dev backend by default", () => {
    expect(API_URL).toBe("http://localhost:9000");
  });

  it("generate resolves to the link from the response", async () => {
    http.post.mockResolvedValueOnce({ data: { url: "http://localhost:9000/out.html" } });

    await expect(generate()).resolves.toBe("http://localhost:9000/out.html");
    expect(http.post).toHaveBeenCalledWith(`${API_URL}/generate`);
  });

  it("reads and saves the tree", async () => {
    await expect(getTree()).resolves.toEqual({ ok: "get" });
    expect(http.get).toHaveBeenCalledWith(`${API_URL}/tree`);

    const treeData = [{ title: "root", key: "1", value: "<p>hi</p>", children: [] }];
    await saveTree({ treeData });
    expect(http.put).toHaveBeenCalledWith(`${API_URL}/tree`, { treeData });
  });

  it("sends the node key in the path, URL-encoded, and the rest as the body", async () => {
    await updateTreeNode({ key: "a/b c", title: "T", value: "V" });
    expect(http.patch).toHaveBeenCalledWith(`${API_URL}/tree/nodes/a%2Fb%20c`, {
      title: "T",
      value: "V",
    });

    await deleteTreeNode({ key: "2026-01-01T00:00:00.000Z1" });
    expect(http.delete).toHaveBeenCalledWith(`${API_URL}/tree/nodes/2026-01-01T00%3A00%3A00.000Z1`);
  });

  it("adds a tree node with the whole payload", async () => {
    const node = { parentKey: "1", item: { key: "2", title: "T", value: "V", children: [] } };
    await addTreeNode(node);
    expect(http.post).toHaveBeenCalledWith(`${API_URL}/tree/nodes`, node);
  });

  it("manages elements under /elements", async () => {
    await getAllElements();
    expect(http.get).toHaveBeenCalledWith(`${API_URL}/elements`);

    await addElement({ key: "k", title: "T", value: "V" });
    expect(http.post).toHaveBeenCalledWith(`${API_URL}/elements`, {
      key: "k",
      title: "T",
      value: "V",
    });

    await updateElement({ key: "k#1", title: "T2", value: "V2" });
    expect(http.patch).toHaveBeenCalledWith(`${API_URL}/elements/k%231`, {
      title: "T2",
      value: "V2",
    });

    await deleteElement({ key: "k#1" });
    expect(http.delete).toHaveBeenCalledWith(`${API_URL}/elements/k%231`);
  });

  it("passes backend errors to the caller", async () => {
    const error = Object.assign(new Error("Request failed with status code 404"), {
      response: { data: { error: { code: "NOT_FOUND", message: "No such node" } } },
    });
    http.delete.mockRejectedValueOnce(error);

    await expect(deleteTreeNode({ key: "missing" })).rejects.toBe(error);
  });
});
