import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Architecture rules from AGENTS.md, enforced instead of only written down.
const axiosOnlyInApi = {
  name: "axios",
  message: "HTTP calls go through src/api/main.ts. Import a function from there instead.",
};

const noUiInLogic = [
  { name: "react", message: "src/ai and src/api stay free of React." },
  { name: "react-dom", message: "src/ai and src/api stay free of React." },
  { name: "antd", message: "src/ai and src/api stay free of UI code." },
];

const noEditorUiInLogic = {
  group: ["**/editor/Main/*", "!**/editor/Main/TemplateTree", "**/editor/Main/*/*.tsx"],
  message:
    "src/ai and src/api must not depend on editor UI. Shared logic (like TemplateTree/nodeBuilders) is fine.",
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "no-restricted-imports": ["error", { paths: [axiosOnlyInApi] }],
    },
  },
  {
    files: ["src/api/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: noUiInLogic, patterns: [noEditorUiInLogic] },
      ],
    },
  },
  {
    files: ["src/ai/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [axiosOnlyInApi, ...noUiInLogic], patterns: [noEditorUiInLogic] },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "blob-report/**",
    "next-env.d.ts",
  ]),
]);
