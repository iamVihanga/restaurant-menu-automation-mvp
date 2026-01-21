import eslintPluginAstro, { processors, rules } from "eslint-plugin-astro";

export default [
  ...eslintPluginAstro.configs.recommended,
  {
    files: ["*.astro", "*.ts", "*.tsx"],
    processors: "astro/client-side-ts",
    rules: {},
  },
];
