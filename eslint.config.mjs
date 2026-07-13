import js from "@eslint/js";
import globals from "globals";
import playwright from "eslint-plugin-playwright";
import tseslint from "typescript-eslint";

export default [
    {
        ignores: [
            "node_modules/**",
            "playwright-report/**",
            "test-results/**",
            "blob-report/**",
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.ts"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
    {
        files: ["playwright.config.ts", "tests/**/*.ts"],
        ...playwright.configs["flat/recommended"],
    },
];
