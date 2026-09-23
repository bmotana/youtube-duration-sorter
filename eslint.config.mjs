import globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ["node_modules/**"] },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: { ...globals.browser, ...globals.node, chrome: "readonly" },
    },
  },
  { ...pluginJs.configs.recommended, files: ["**/*.js"] },
];
