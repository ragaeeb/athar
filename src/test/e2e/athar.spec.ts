import { expect, type Page, test } from '@playwright/test';

type AtharDevWindow = Window &
    typeof globalThis & {
        __atharDev__?: {
            grantTokens: (count?: number) => void;
            teleportToTeacher: () => void;
            teleportToFinalMilestone: () => void;
        };
    };

const clickDialogueAction = async (page: Page) => {
    const dialogue = page.getByRole('dialog');
    const receiveHadithButton = page.getByRole('button', { name: /receive hadith/i });
    await expect(dialogue).toBeVisible();
    await expect(receiveHadithButton).toBeVisible();
    await expect(receiveHadithButton).toBeEnabled();
    await receiveHadithButton.click({ force: true });
    await expect(dialogue).toBeHidden();
};

const waitForDevBridge = (page: Page) => page.waitForFunction(() => Boolean((window as AtharDevWindow).__atharDev__));

const grantTokens = (page: Page, count: number) =>
    page.evaluate((value) => {
        (window as AtharDevWindow).__atharDev__?.grantTokens(value);
    }, count);

const teleportToTeacher = (page: Page) =>
    page.evaluate(() => {
        (window as AtharDevWindow).__atharDev__?.teleportToTeacher();
    });

const teleportToFinalMilestone = (page: Page) =>
    page.evaluate(() => {
        (window as AtharDevWindow).__atharDev__?.teleportToFinalMilestone();
    });

test('completes the deterministic level one through level five smoke path', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /abu dawud al-sijistani/i }).click();
    await page.getByRole('button', { name: /begin level 1/i }).click();

    await expect(page).toHaveURL(/\/game\/level-1$/);

    await waitForDevBridge(page);

    await grantTokens(page, 30);
    await teleportToTeacher(page);

    await clickDialogueAction(page);

    await teleportToFinalMilestone(page);

    await expect(page.getByRole('button', { name: /review the journey/i })).toBeVisible();
    await page.getByRole('button', { name: /review the journey/i }).click();

    await expect(page).toHaveURL(/\/game\/level-1\/complete$/);
    await expect(page.getByText(/route note/i)).toBeVisible();
    await page.getByRole('link', { name: /enter the hijaz/i }).click();

    await expect(page).toHaveURL(/\/game\/level-2$/);

    await waitForDevBridge(page);

    for (const tokenGrant of [12, 12, 12]) {
        await grantTokens(page, tokenGrant);
        await teleportToTeacher(page);

        await clickDialogueAction(page);
    }

    await teleportToFinalMilestone(page);

    const reviewHijazRouteButton = page.getByRole('button', { name: /review the hijaz route/i });
    await expect(reviewHijazRouteButton).toBeVisible();
    await expect(reviewHijazRouteButton).toBeEnabled();
    await reviewHijazRouteButton.click({ force: true });

    await page.waitForURL(/\/game\/level-2\/complete$/);
    await expect(page.getByText(/hijaz route note/i)).toBeVisible();
    await page.getByRole('link', { name: /enter iraq/i }).click();

    await expect(page).toHaveURL(/\/game\/level-3$/);

    await waitForDevBridge(page);

    for (const tokenGrant of [16, 16, 16]) {
        await grantTokens(page, tokenGrant);
        await teleportToTeacher(page);
        await clickDialogueAction(page);
    }

    await teleportToFinalMilestone(page);

    const reviewIraqRouteButton = page.getByRole('button', { name: /review the iraq route/i });
    await expect(reviewIraqRouteButton).toBeVisible();
    await expect(reviewIraqRouteButton).toBeEnabled();
    await reviewIraqRouteButton.click({ force: true });

    await page.waitForURL(/\/game\/level-3\/complete$/);
    await expect(page.getByText(/iraq route note/i)).toBeVisible();
    await page.getByRole('link', { name: /return east/i }).click();

    await expect(page).toHaveURL(/\/game\/level-4$/);

    await waitForDevBridge(page);

    await grantTokens(page, 52);
    await teleportToTeacher(page);
    await clickDialogueAction(page);
    await teleportToFinalMilestone(page);

    const reviewEasternRouteButton = page.getByRole('button', { name: /review the eastern route/i });
    await expect(reviewEasternRouteButton).toBeVisible();
    await expect(reviewEasternRouteButton).toBeEnabled();
    await reviewEasternRouteButton.click({ force: true });

    await page.waitForURL(/\/game\/level-4\/complete$/);
    await expect(page.getByText(/eastern route note/i)).toBeVisible();
    await page.getByRole('link', { name: /begin the finale/i }).click();

    await expect(page).toHaveURL(/\/game\/level-5$/);

    await waitForDevBridge(page);

    for (const tokenGrant of [30, 30]) {
        await grantTokens(page, tokenGrant);
        await teleportToTeacher(page);
        await clickDialogueAction(page);
    }

    await teleportToFinalMilestone(page);

    const reviewLegacyButton = page.getByRole('button', { name: /review the legacy/i });
    await expect(reviewLegacyButton).toBeVisible();
    await expect(reviewLegacyButton).toBeEnabled();
    await reviewLegacyButton.click({ force: true });

    await page.waitForURL(/\/game\/level-5\/complete$/);
    await expect(page.getByText(/legacy note/i)).toBeVisible();
    await expect(page.getByText(/all chapters complete/i)).toBeVisible();
    await expect(page.getByText(/legacy of the journey/i)).toBeVisible();
    await expect(page.getByText(/coming soon/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
});
