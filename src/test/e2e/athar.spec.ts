import { expect, type Page, test } from '@playwright/test';

const clickDialogueAction = async (page: Page) => {
    const dialogue = page.getByRole('dialog');
    const receiveHadithButton = page.getByRole('button', { name: /receive hadith/i });
    await expect(dialogue).toBeVisible();
    await expect(receiveHadithButton).toBeVisible();
    await expect(receiveHadithButton).toBeEnabled();
    await receiveHadithButton.click({ force: true });
    await expect(dialogue).toBeHidden();
};

test('completes the deterministic level one and level two smoke path', async ({ page }) => {
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

    await clickDialogueAction(page);

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

    await expect(page).toHaveURL(/\/game\/level-1\/complete$/);
    await expect(page.getByText(/route note/i)).toBeVisible();
    await page.getByRole('link', { name: /enter the hijaz/i }).click();

    await expect(page).toHaveURL(/\/game\/level-2$/);

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

    for (const tokenGrant of [12, 12, 12]) {
        await page.evaluate((count) => {
            (
                window as Window &
                    typeof globalThis & {
                        __atharDev__?: {
                            grantTokens: (value?: number) => void;
                            teleportToTeacher: () => void;
                        };
                    }
            ).__atharDev__?.grantTokens(count);
        }, tokenGrant);

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

        await clickDialogueAction(page);
    }

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

    const reviewHijazRouteButton = page.getByRole('button', { name: /review the hijaz route/i });
    await expect(reviewHijazRouteButton).toBeVisible();
    await expect(reviewHijazRouteButton).toBeEnabled();
    await reviewHijazRouteButton.click({ force: true });

    await page.waitForURL(/\/game\/level-2\/complete$/);
    await expect(page.getByText(/hijaz route note/i)).toBeVisible();
    await expect(page.getByText(/coming soon/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /enter iraq/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
});
