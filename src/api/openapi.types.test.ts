import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

const root = resolve(__dirname, "../..");

it("openapi.types.ts is generated from the committed openapi.json (run `npm run api:types`)", () => {
  const generated = execFileSync(
    process.execPath,
    ["node_modules/openapi-typescript/bin/cli.js", "src/api/openapi.json"],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );

  expect(readFileSync(resolve(root, "src/api/openapi.types.ts"), "utf8")).toBe(generated);
});
