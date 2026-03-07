import { expect, test } from '@playwright/test';

test('completes the deterministic level one smoke path', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /abu dawud al-sijistani/i }).click();
    await page.getByRole('button', { name: /begin level 1/i }).click();

    await expect(page).toHaveURL(/\/game\/level-1$/);

    await page.waitForFunction(() =>
        Boolean(
            (
                window as Window &
                    typeof globalThis & {
                        __atharDev__?: { grantTokens: (count?: number) => void };
                    }
            ).__atharDev__,
        ),
    );

    await page.evaluate(() => {
        (
            window as Window &
                typeof globalThis & {
                    __atharDev__?: {
                        grantTokens: (count?: number) => void;
                        teleportToTeacher: () => void;
                        teleportToFinalMilestone: () => void;
                    };
                }
        ).__atharDev__?.grantTokens(30);
    });

    await page.evaluate(() => {
        (
            window as Window &
                typeof globalThis & {
                    __atharDev__?: {
                        teleportToTeacher: () => void;
                    };
                }
        ).__atharDev__?.teleportToTeacher();
    });

    await expect(page.getByRole('button', { name: /receive hadith/i })).toBeVisible();
    await page.getByRole('button', { name: /receive hadith/i }).click();

    await page.evaluate(() => {
        (
            window as Window &
                typeof globalThis & {
                    __atharDev__?: {
                        teleportToFinalMilestone: () => void;
                    };
                }
        ).__atharDev__?.teleportToFinalMilestone();
    });

    await expect(page.getByText(/chapter complete/i)).toBeVisible();
    await page.getByRole('button', { name: /continue athar/i }).click();

    await expect(page).toHaveURL(/\/game\/level-1\/complete$/);
    await expect(page.getByText(/historical note/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /^continue athar$/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
});
