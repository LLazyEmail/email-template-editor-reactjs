// API types come from the backend's contract (src/api/openapi.json), not from hand-written copies.
// After the backend changes: `npm run api:pull && npm run api:types`.
import type { components } from "./openapi.types";

type Schemas = components["schemas"];

export type GenerateResponse = Schemas["GenerateResponse"];

/** The backend's error body: `{ error: { code, message, details?, requestId? } }`. */
export type ApiError = Schemas["ErrorResponse"];

/** A template tree node as stored by the backend. */
export type TreeNodeData = Schemas["TreeNode"];

/** PUT /tree replaces the whole tree in one atomic write. */
export type SaveTree = Schemas["SaveTreeBody"];

export type UpdateTreeNode = { key: string } & Schemas["UpdateNodeBody"];

export type AddTreeNode = Schemas["AddNodeBody"];

export type DeleteTreeNode = { key: string };

export type Element = Schemas["Element"];

export type AddElement = Schemas["CreateElementBody"];

export type UpdateElement = { key: string } & Schemas["UpdateElementBody"];

export type DeleteElement = { key: string };
