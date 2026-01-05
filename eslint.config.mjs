import typescriptEslint from "typescript-eslint";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "scripts/fix-lightningcss.js",
    ],
  },
  ...typescriptEslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {},
  },
];

