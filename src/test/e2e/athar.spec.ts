import { expect, type Page, test } from '@playwright/test';
import { grantTokens, teleportToFinalMilestone, teleportToTeacher, waitForLevelDevBridge } from '@/test/e2e/dev-bridge';

const clickDialogueAction = async (page: Page) => {
    const dialogue = page.getByRole('dialog');
    const receiveHadithButton = page.getByRole('button', { name: /receive hadith/i });
    await expect(dialogue).toBeVisible();
    await expect(receiveHadithButton).toBeVisible();
    await expect(receiveHadithButton).toBeEnabled();
    await receiveHadithButton.click({ force: true });
    await expect(dialogue).toBeHidden();
};

test('completes the deterministic level one through level five smoke path', async ({ page }) => {
    test.slow();
    await page.goto('/');

    await page.getByRole('button', { name: /abu dawud al-sijistani/i }).click();
    await page.getByRole('button', { name: /begin level 1/i }).click();

    await expect(page).toHaveURL(/\/game\/level-1$/);
    await waitForLevelDevBridge(page, 'level-1');

    await grantTokens(page, 'level-1', 30);
    await teleportToTeacher(page, 'level-1');

    await clickDialogueAction(page);

    await teleportToFinalMilestone(page, 'level-1');

    await expect(page.getByRole('button', { name: /review the journey/i })).toBeVisible();
    await page.getByRole('button', { name: /review the journey/i }).click();

    await expect(page).toHaveURL(/\/game\/level-1\/complete$/);
    await expect(page.getByText(/route note/i)).toBeVisible();
    await page.getByRole('link', { name: /enter the hijaz/i }).click();

    await expect(page).toHaveURL(/\/game\/level-2$/);
    await waitForLevelDevBridge(page, 'level-2');

    for (const tokenGrant of [12, 12, 12]) {
        await grantTokens(page, 'level-2', tokenGrant);
        await teleportToTeacher(page, 'level-2');

        await clickDialogueAction(page);
    }

    await teleportToFinalMilestone(page, 'level-2');

    const reviewHijazRouteButton = page.getByRole('button', { name: /review the hijaz route/i });
    await expect(reviewHijazRouteButton).toBeVisible();
    await expect(reviewHijazRouteButton).toBeEnabled();
    await reviewHijazRouteButton.click({ force: true });

    await page.waitForURL(/\/game\/level-2\/complete$/);
    await expect(page.getByText(/hijaz route note/i)).toBeVisible();
    await page.getByRole('link', { name: /enter iraq/i }).click();

    await expect(page).toHaveURL(/\/game\/level-3$/);
    await waitForLevelDevBridge(page, 'level-3');

    for (const tokenGrant of [16, 16, 16]) {
        await grantTokens(page, 'level-3', tokenGrant);
        await teleportToTeacher(page, 'level-3');
        await clickDialogueAction(page);
    }

    await teleportToFinalMilestone(page, 'level-3');

    const reviewIraqRouteButton = page.getByRole('button', { name: /review the iraq route/i });
    await expect(reviewIraqRouteButton).toBeVisible();
    await expect(reviewIraqRouteButton).toBeEnabled();
    await reviewIraqRouteButton.click({ force: true });

    await page.waitForURL(/\/game\/level-3\/complete$/);
    await expect(page.getByText(/iraq route note/i)).toBeVisible();
    await page.getByRole('link', { name: /return east/i }).click();

    await expect(page).toHaveURL(/\/game\/level-4$/);
    await waitForLevelDevBridge(page, 'level-4');

    await grantTokens(page, 'level-4', 52);
    await teleportToTeacher(page, 'level-4');
    await clickDialogueAction(page);
    await teleportToFinalMilestone(page, 'level-4');

    const reviewEasternRouteButton = page.getByRole('button', { name: /review the eastern route/i });
    await expect(reviewEasternRouteButton).toBeVisible();
    await expect(reviewEasternRouteButton).toBeEnabled();
    await reviewEasternRouteButton.click({ force: true });

    await page.waitForURL(/\/game\/level-4\/complete$/);
    await expect(page.getByText(/eastern route note/i)).toBeVisible();
    await page.getByRole('link', { name: /begin the finale/i }).click();

    await expect(page).toHaveURL(/\/game\/level-5$/);
    await waitForLevelDevBridge(page, 'level-5');

    for (const tokenGrant of [30, 30]) {
        await grantTokens(page, 'level-5', tokenGrant);
        await teleportToTeacher(page, 'level-5');
        await clickDialogueAction(page);
    }

    await teleportToFinalMilestone(page, 'level-5');

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
