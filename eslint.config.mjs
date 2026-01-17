import js from '@eslint/js';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import { defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
   globalIgnores(['**/*.config.*']),
   {
      files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
      plugins: { js },
      extends: ['js/recommended'],
   },
   {
      files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
      languageOptions: { globals: globals.browser },
   },
   tseslint.configs.recommended,
   pluginReact.configs.flat.recommended,
   importPlugin.flatConfigs.recommended,
   {
      files: ['**/*.json'],
      plugins: { json },
      language: 'json/json',
      extends: ['json/recommended'],
   },
   {
      files: ['**/*.md'],
      plugins: { markdown },
      language: 'markdown/commonmark',
      extends: ['markdown/recommended'],
   },
   {
      rules: {
         'arrow-body-style': 'off',
         'react/display-name': 'off',
         'prefer-arrow-callback': 'off',
         'import/prefer-default-export': 'off',
         'react-hooks/exhaustive-deps': 'off',
         'no-plusplus': 'off',
         'no-unused-vars': 'off',
         '@typescript-eslint/no-unused-vars': 'error',
         'prefer-const': 'warn',
         'function-paren-newline': 'off',
         'object-shorthand': 'warn',
         'no-multi-spaces': 'error',
         'no-restricted-imports': 'warn',
         'react/react-in-jsx-scope': 'off',
         quotes: ['error', 'single'],
         'max-len': [
            'error',
            {
               code: 110,
               ignorePattern: 'd="([\\s\\S]*?)"',
            },
         ],
         'max-lines': [
            'error',
            {
               max: 600,
               skipBlankLines: true,
               skipComments: true,
            },
         ],
         'no-console': [
            'warn',
            {
               allow: ['warn', 'error'],
            },
         ],
         'import/named': 'off',
         'import/no-unresolved': 'off',
         'import/order': [
            'error',
            {
               alphabetize: { order: 'asc', caseInsensitive: true },
               'newlines-between': 'always',
               groups: [
                  ['builtin', 'external'],
                  ['internal'],
                  ['parent', 'sibling', 'index'],
               ],
               pathGroups: [
                  { pattern: '**/*.css', group: 'index', position: 'after' },
                  { pattern: '**/*.scss', group: 'index', position: 'after' },
               ],
               pathGroupsExcludedImportTypes: ['builtin', 'external'],
            },
         ],
      },
   },
]);
