/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
        dedupe: ['three'],
    },
    test: {
        css: true,
        environment: 'jsdom',
        exclude: [...configDefaults.exclude, 'src/test/e2e/**'],
        setupFiles: './vitest.setup.ts',
    },
});
