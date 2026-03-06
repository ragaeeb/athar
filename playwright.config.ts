import { defineConfig } from '@playwright/test';

export default defineConfig({
    fullyParallel: false,
    testDir: './src/test/e2e',
    use: {
        baseURL: 'http://127.0.0.1:4173',
        headless: true,
    },
    webServer: {
        command: 'bunx vite --host 127.0.0.1 --port 4173',
        reuseExistingServer: true,
        timeout: 120_000,
        url: 'http://127.0.0.1:4173',
    },
});
