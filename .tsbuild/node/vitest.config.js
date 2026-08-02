import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
const r = (p) => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
    resolve: {
        alias: {
            '@core': r('./src/core'),
            '@db': r('./src/db'),
            '@ui': r('./src/ui'),
            '@store': r('./src/store'),
            '@test': r('./src/test'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        reporters: ['default'],
    },
});
