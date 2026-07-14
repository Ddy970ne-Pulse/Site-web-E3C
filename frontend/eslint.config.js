const js = require("@eslint/js");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // French copy is full of apostrophes ("l'entreprise", "d'intervention"...) —
      // this rule would demand escaping every one of them as &apos; for no
      // functional benefit, so it's actively counterproductive here.
      "react/no-unescaped-entities": "off",
      // cmdk-input-wrapper is a real DOM attribute the cmdk library reads as a
      // CSS selector hook (see components/ui/command.jsx) — not a typo.
      "react/no-unknown-property": ["error", { ignore: ["cmdk-input-wrapper"] }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["build/**", "node_modules/**", "plugins/**"],
  },
];
