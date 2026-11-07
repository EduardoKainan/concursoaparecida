import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import quality from './eslint-rules/index.cjs';

export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**', 'verify.mjs']),
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        location: 'readonly',
        process: 'readonly',
      },
    },
    plugins: { quality },
    rules: {
      ...js.configs.recommended.rules,
      'quality/max-lines': ['error', { max: 350 }],
      // Baseline: two existing console.log calls in scripts/build.js.
      'quality/no-direct-console': ['warn', { logger: 'the project logging helper' }],
    },
  },
]);
