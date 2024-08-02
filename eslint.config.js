import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";


export default [
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
            },
        }
    },
    {},
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
];
