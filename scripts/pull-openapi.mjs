// Downloads the backend's API contract into src/api/openapi.json. Run through `npm run api:sync`,
// which then regenerates src/api/openapi.types.ts.
// Default: the backend's main branch. For a local backend or a branch, set OPENAPI_URL, e.g.
//   OPENAPI_URL=http://localhost:9000/openapi.json npm run api:sync
import { writeFile } from "node:fs/promises";

const url =
  process.env.OPENAPI_URL ??
  "https://raw.githubusercontent.com/LLazyEmail/email-template-editor-nodejs/main/openapi.json";
const target = new URL("../src/api/openapi.json", import.meta.url);

const response = await fetch(url);
if (!response.ok) {
  console.error(`GET ${url} → ${response.status} ${response.statusText}`);
  process.exit(1);
}
const contract = await response.json();
if (typeof contract.openapi !== "string" || !contract.paths) {
  console.error(`${url} is not an OpenAPI document`);
  process.exit(1);
}

await writeFile(target, JSON.stringify(contract, null, 2) + "\n");
process.stdout.write(`${url} → src/api/openapi.json\n`);
