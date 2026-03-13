/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

// @rolldown/plugin-babel's published PluginOptions typing is stricter than its
// documented usage for presets-only configs. React Compiler still runs through
// this supported runtime path.
const reactCompilerOptions = {
    presets: [reactCompilerPreset()],
} as Parameters<typeof babel>[0];

export default defineConfig({
    plugins: [react(), babel(reactCompilerOptions), tailwindcss()],
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
