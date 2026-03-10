import { expect, type Page, test } from '@playwright/test';
import {
    getMapView,
    getPerfSnapshot,
    resetPerfMetrics,
    setMapView,
    simulatePerfFrames,
    waitForMapView,
    waitForPerfDevBridge,
} from '@/test/e2e/dev-bridge';

const startLevelOne = async (page: Page) => {
    await page.goto('/');
    await page.getByRole('button', { name: /begin level 1/i }).click();
    await expect(page).toHaveURL(/\/game\/level-1$/);
    await waitForPerfDevBridge(page, 'level-1');
};

test('@perf manual zoom stays manual', async ({ page }) => {
    await startLevelOne(page);

    const initialView = await getMapView(page, 'level-1');

    await resetPerfMetrics(page, 'level-1');

    await setMapView(page, 'level-1', {
        zoom: (initialView?.zoom ?? 7.4) - 0.6,
    });

    await simulatePerfFrames(page, 'level-1', { durationMs: 200 });

    const snapshot = await getPerfSnapshot(page, 'level-1');
    const currentView = await getMapView(page, 'level-1');

    expect(snapshot?.camera.followCount).toBe(0);
    expect(snapshot?.camera.skippedDuringCooldownCount).toBeGreaterThan(0);
    expect(snapshot?.map.manualInteractionCount).toBeGreaterThan(0);
    expect(Math.abs((currentView?.center?.lat ?? 0) - (initialView?.center?.lat ?? 0))).toBeLessThan(0.0001);
    expect(Math.abs((currentView?.center?.lng ?? 0) - (initialView?.center?.lng ?? 0))).toBeLessThan(0.0001);
});

test('@perf manual pan away from the player stays manual while simulation advances', async ({ page }) => {
    await startLevelOne(page);

    const initialView = await getMapView(page, 'level-1');
    const manualCenter = {
        lat: (initialView?.center?.lat ?? 39.77) - 1.6,
        lng: (initialView?.center?.lng ?? 64.43) + 2.2,
    };

    await resetPerfMetrics(page, 'level-1');

    await setMapView(page, 'level-1', {
        center: manualCenter,
        zoom: 8.1,
    });

    await simulatePerfFrames(page, 'level-1', {
        durationMs: 1_250,
        moveX: 1,
        moveZ: 0,
    });

    const snapshot = await getPerfSnapshot(page, 'level-1');
    const currentView = await getMapView(page, 'level-1');

    expect(snapshot?.camera.followCount).toBe(0);
    expect(snapshot?.camera.skippedDuringCooldownCount).toBeGreaterThan(0);
    expect(snapshot?.map.manualInteractionCount).toBeGreaterThan(0);
    expect(Math.abs((currentView?.center?.lat ?? 0) - manualCenter.lat)).toBeLessThan(0.0001);
    expect(Math.abs((currentView?.center?.lng ?? 0) - manualCenter.lng)).toBeLessThan(0.0001);
});

test('@perf zoomed-out travel stays bounded', async ({ page }) => {
    await startLevelOne(page);

    const initialView = await getMapView(page, 'level-1');

    await setMapView(page, 'level-1', {
        pitch: 58,
        zoom: 6.4,
    });

    await waitForMapView(page, 'level-1', {
        pitch: 58,
        zoom: 6.4,
    });

    await resetPerfMetrics(page, 'level-1');

    await simulatePerfFrames(page, 'level-1', {
        durationMs: 1_250,
        moveX: 1,
        moveZ: 0,
    });

    const snapshot = await getPerfSnapshot(page, 'level-1');
    const currentView = await getMapView(page, 'level-1');

    console.info('Athar perf snapshot', JSON.stringify(snapshot));

    expect(snapshot?.player.movementTickCount ?? 0).toBeGreaterThan(0);
    expect(snapshot?.player.locationWriteCount ?? 0).toBeGreaterThan(0);
    expect((currentView?.center?.lng ?? 0) - (initialView?.center?.lng ?? 0)).toBeGreaterThan(0.01);
    expect(Math.abs((currentView?.center?.lat ?? 0) - (initialView?.center?.lat ?? 0))).toBeLessThan(0.02);
    expect(snapshot?.camera.maxDistanceFromTargetMeters ?? Number.POSITIVE_INFINITY).toBeLessThan(150_000);
    expect(snapshot?.frame.longFramesOver100Ms).toBe(0);
    expect(snapshot?.frame.p95DeltaMs ?? 0).toBeGreaterThan(0);
});
