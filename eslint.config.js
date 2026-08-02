// @ts-check
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist', '.tsbuild', 'node_modules', 'coverage', '.tmp'] },
  js.configs.recommended,
  {
    // Công cụ chạy bằng Node, không phải mã ứng dụng.
    files: ['tools/**/*.mjs', '*.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly' },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        structuredClone: 'readonly',
        indexedDB: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        AbortController: 'readonly',
        fetch: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin, 'react-hooks': reactHooks },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      // [BB] Preset ngoài là dữ liệu không tin cậy — không eval, không new Function.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    // [BB] src/core là TypeScript thuần: cấm React, UI, Dexie, AI client, network.
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-*', '**/ui/**'], message: 'core/ khong duoc import React hoac UI.' },
            { group: ['dexie', 'dexie-*', '**/db/**'], message: 'core/ khong duoc import Dexie hoac db/.' },
            { group: ['framer-motion', 'zustand'], message: 'core/ khong duoc import runtime UI state.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'core/ khong duoc goi network.' },
        { name: 'indexedDB', message: 'core/ khong duoc dung IndexedDB truc tiep.' },
        { name: 'window', message: 'core/ khong duoc dung window.' },
        { name: 'document', message: 'core/ khong duoc dung document.' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: '[BB] Dung seeded RNG trong core, khong dung Math.random().',
        },
        { object: 'Date', property: 'now', message: '[BB] Khong dung thoi gian may trong mo phong.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date']",
          message: '[BB] Khong dung thoi gian may trong mo phong; dung tick.',
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleString']",
          message: '[BB] Khong dung locale-dependent formatting trong core.',
        },
        {
          selector: "CallExpression[callee.property.name='localeCompare']",
          message: '[BB] Khong dung locale-dependent sort trong mo phong.',
        },
        {
          selector: 'ImportExpression',
          message: '[BB] Khong dung dynamic import trong core.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/test/**/*.ts'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-syntax': 'off',
      'no-restricted-properties': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
