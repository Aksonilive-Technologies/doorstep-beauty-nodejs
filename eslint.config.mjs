import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    languageOptions: {
      globals: globals.node, // ✅ Use Node.js globals instead of browser
    },
    rules: {
      "no-undef": "off" // ✅ Prevents ESLint from flagging require/exports as undefined
    }
  },
  pluginJs.configs.recommended,
];
