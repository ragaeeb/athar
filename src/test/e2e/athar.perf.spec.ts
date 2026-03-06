import { expect, type Page, test } from '@playwright/test';

type PerfSnapshot = {
    camera: {
        followCount: number;
        maxAppliedStepMeters: number;
        maxDistanceFromTargetMeters: number;
        skippedDuringCooldownCount: number;
    };
    frame: {
        count: number;
        longFramesOver100Ms: number;
        longFramesOver34Ms: number;
        longFramesOver50Ms: number;
        maxDeltaMs: number;
        p50DeltaMs: number;
        p95DeltaMs: number;
    };
    map: {
        bearing: number | null;
        center: { lat: number; lng: number } | null;
        manualInteractionCount: number;
        pitch: number | null;
        zoom: number | null;
    };
    player: {
        locationWriteCount: number;
        movementTickCount: number;
    };
};

type MapView = {
    bearing: number | null;
    center: { lat: number; lng: number } | null;
    pitch: number | null;
    zoom: number | null;
};

type AtharPerfWindow = Window &
    typeof globalThis & {
        __atharDev__?: {
            getMapView: () => MapView;
            getPerfSnapshot: () => PerfSnapshot;
            resetPerfMetrics: () => void;
            setMapView: (view: {
                bearing?: number;
                center?: { lat: number; lng: number };
                pitch?: number;
                zoom?: number;
            }) => void;
            simulatePerfFrames: (options: {
                durationMs: number;
                moveX?: number;
                moveZ?: number;
                stepMs?: number;
            }) => void;
        };
    };

const waitForPerfBridge = (page: Page) =>
    page.waitForFunction(
        () =>
            Boolean((window as AtharPerfWindow).__atharDev__?.getPerfSnapshot) &&
            Boolean((window as AtharPerfWindow).__atharDev__?.getMapView) &&
            Boolean((window as AtharPerfWindow).__atharDev__?.setMapView) &&
            Boolean((window as AtharPerfWindow).__atharDev__?.getMapView().center),
    );

const startLevelOne = async (page: Page) => {
    await page.goto('/');
    await page.getByRole('button', { name: /begin level 1/i }).click();
    await expect(page).toHaveURL(/\/game\/level-1$/);
    await waitForPerfBridge(page);
};

test('@perf manual zoom stays manual', async ({ page }) => {
    await startLevelOne(page);

    const initialView = await page.evaluate(() => (window as AtharPerfWindow).__atharDev__?.getMapView());

    await page.evaluate(() => {
        (window as AtharPerfWindow).__atharDev__?.resetPerfMetrics();
    });

    await page.evaluate(
        (zoom) => {
            (window as AtharPerfWindow).__atharDev__?.setMapView({ zoom });
        },
        (initialView?.zoom ?? 7.4) - 0.6,
    );

    await page.evaluate(() => {
        (window as AtharPerfWindow).__atharDev__?.simulatePerfFrames({ durationMs: 200 });
    });

    const snapshot = await page.evaluate(() => (window as AtharPerfWindow).__atharDev__?.getPerfSnapshot());
    const currentView = await page.evaluate(() => (window as AtharPerfWindow).__atharDev__?.getMapView());

    expect(snapshot?.camera.followCount).toBe(0);
    expect(snapshot?.camera.skippedDuringCooldownCount).toBeGreaterThan(0);
    expect(snapshot?.map.manualInteractionCount).toBeGreaterThan(0);
    expect(Math.abs((currentView?.center?.lat ?? 0) - (initialView?.center?.lat ?? 0))).toBeLessThan(0.0001);
    expect(Math.abs((currentView?.center?.lng ?? 0) - (initialView?.center?.lng ?? 0))).toBeLessThan(0.0001);
});

test('@perf zoomed-out travel stays bounded', async ({ page }) => {
    await startLevelOne(page);

    const initialView = await page.evaluate(() => (window as AtharPerfWindow).__atharDev__?.getMapView());

    await page.evaluate(() => {
        (window as AtharPerfWindow).__atharDev__?.setMapView({
            pitch: 58,
            zoom: 6.4,
        });
    });

    await page.waitForTimeout(1_000);

    await page.evaluate(() => {
        (window as AtharPerfWindow).__atharDev__?.resetPerfMetrics();
    });

    await page.evaluate(() => {
        (window as AtharPerfWindow).__atharDev__?.simulatePerfFrames({
            durationMs: 1_250,
            moveX: 1,
            moveZ: 0,
        });
    });

    const snapshot = await page.evaluate(() => (window as AtharPerfWindow).__atharDev__?.getPerfSnapshot());
    const currentView = await page.evaluate(() => (window as AtharPerfWindow).__atharDev__?.getMapView());

    console.info('Athar perf snapshot', JSON.stringify(snapshot));

    expect(snapshot?.player.movementTickCount ?? 0).toBeGreaterThan(0);
    expect(snapshot?.player.locationWriteCount ?? 0).toBeGreaterThan(0);
    expect((currentView?.center?.lng ?? 0) - (initialView?.center?.lng ?? 0)).toBeGreaterThan(0.01);
    expect(Math.abs((currentView?.center?.lat ?? 0) - (initialView?.center?.lat ?? 0))).toBeLessThan(0.02);
    expect(snapshot?.camera.maxDistanceFromTargetMeters ?? Number.POSITIVE_INFINITY).toBeLessThan(150_000);
    expect(snapshot?.frame.longFramesOver100Ms).toBe(0);
    expect(snapshot?.frame.p95DeltaMs ?? 0).toBeGreaterThan(0);
});
