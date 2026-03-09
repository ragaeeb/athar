import { expect, test } from '@playwright/test';

test.use({
    hasTouch: true,
    isMobile: true,
    viewport: {
        height: 844,
        width: 390,
    },
});

test('loads level two and supports pause/resume on a mobile viewport smoke path', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /begin level 1/i }).click();
    await expect(page).toHaveURL(/\/game\/level-1$/);

    await page.waitForFunction(() =>
        Boolean(
            (
                window as Window &
                    typeof globalThis & {
                        __atharDev__?: {
                            grantTokens: (count?: number) => void;
                            teleportToTeacher: () => void;
                            teleportToFinalMilestone: () => void;
                        };
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
                    };
                }
        ).__atharDev__?.grantTokens(30);
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

    await expect(page.getByRole('button', { name: /review the journey/i })).toBeVisible();
    await page.getByRole('button', { name: /review the journey/i }).click();
    await page.getByRole('link', { name: /enter the hijaz/i }).click();

    await expect(page).toHaveURL(/\/game\/level-2$/);
    await expect(page.getByRole('button', { name: /pause journey/i })).toBeVisible();

    await page.getByRole('button', { name: /pause journey/i }).click();
    await expect(page.getByText(/journey paused/i)).toBeVisible();
    await page
        .getByRole('button', { name: /resume journey/i })
        .last()
        .click();
    await expect(page.getByText(/journey paused/i)).toHaveCount(0);
});
