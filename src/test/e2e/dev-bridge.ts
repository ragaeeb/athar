import type { Page } from '@playwright/test';
import type { MapViewSnapshot, PerfSnapshot } from '@/features/debug/perf-metrics';

type MapViewUpdate = {
    bearing?: number;
    center?: { lat: number; lng: number };
    pitch?: number;
    zoom?: number;
};

type PerfSimulationOptions = {
    durationMs: number;
    moveX?: number;
    moveZ?: number;
    stepMs?: number;
};

type AtharDevBridge = {
    completeLevel: () => void;
    getLastPerfSnapshot: () => PerfSnapshot;
    getMapView: () => MapViewSnapshot | null;
    getPerfSnapshot: () => PerfSnapshot;
    grantTokens: (count?: number) => void;
    levelId: string;
    resetPerfMetrics: () => void;
    setMapView: (view: MapViewUpdate) => void;
    simulatePerfFrames: (options: PerfSimulationOptions) => void;
    teleportToFinalMilestone: () => void;
    teleportToTeacher: () => void;
};

type AtharDevWindow = Window & typeof globalThis & { __atharDev__?: AtharDevBridge };

const DEFAULT_REQUIRED_METHODS: Array<keyof AtharDevBridge> = [
    'grantTokens',
    'teleportToTeacher',
    'teleportToFinalMilestone',
];

const PERF_REQUIRED_METHODS: Array<keyof AtharDevBridge> = [
    'getLastPerfSnapshot',
    'getMapView',
    'getPerfSnapshot',
    'resetPerfMetrics',
    'setMapView',
    'simulatePerfFrames',
];

const waitForBridgeMethods = (
    page: Page,
    levelId: string,
    requiredMethods: Array<keyof AtharDevBridge> = DEFAULT_REQUIRED_METHODS,
) =>
    page.waitForFunction(
        ({ expectedLevelId, methods }) => {
            const bridge = (window as AtharDevWindow).__atharDev__;
            if (!bridge || bridge.levelId !== expectedLevelId) {
                return false;
            }

            return methods.every((method) => typeof (bridge as Record<string, unknown>)[method] === 'function');
        },
        {
            expectedLevelId: levelId,
            methods: requiredMethods,
        },
    );

const callBridge = async <TArg, TResult>(
    page: Page,
    levelId: string,
    method: keyof AtharDevBridge,
    argument?: TArg,
) => {
    await waitForBridgeMethods(page, levelId, [method]);

    return page.evaluate(
        ({ expectedLevelId, methodName, value }) => {
            const bridge = (window as AtharDevWindow).__atharDev__;
            if (!bridge || bridge.levelId !== expectedLevelId) {
                throw new Error(`Athar dev bridge not ready for ${expectedLevelId}`);
            }

            const bridgeMethod = (bridge as Record<string, unknown>)[methodName];
            if (typeof bridgeMethod !== 'function') {
                throw new Error(`Athar dev bridge method "${methodName}" is unavailable`);
            }

            return (bridgeMethod as (argument?: unknown) => unknown)(value);
        },
        {
            expectedLevelId: levelId,
            methodName: method,
            value: argument,
        },
    ) as Promise<TResult>;
};

export const waitForLevelDevBridge = (page: Page, levelId: string) => waitForBridgeMethods(page, levelId);

export const waitForPerfDevBridge = async (page: Page, levelId: string) => {
    await waitForBridgeMethods(page, levelId, PERF_REQUIRED_METHODS);
    await waitForMapView(page, levelId, { hasCenter: true });
};

export const waitForMapView = (
    page: Page,
    levelId: string,
    options: {
        hasCenter?: boolean;
        pitch?: number;
        pitchTolerance?: number;
        zoom?: number;
        zoomTolerance?: number;
    },
) =>
    page.waitForFunction(
        ({ expectedLevelId, expectedPitch, expectedZoom, hasCenter, pitchTolerance, zoomTolerance }) => {
            const bridge = (window as AtharDevWindow).__atharDev__;
            if (!bridge || bridge.levelId !== expectedLevelId) {
                return false;
            }

            const view = bridge.getMapView();
            if (hasCenter && !view?.center) {
                return false;
            }

            if (typeof expectedPitch === 'number' && Math.abs((view?.pitch ?? 0) - expectedPitch) > pitchTolerance) {
                return false;
            }

            if (typeof expectedZoom === 'number' && Math.abs((view?.zoom ?? 0) - expectedZoom) > zoomTolerance) {
                return false;
            }

            return true;
        },
        {
            expectedLevelId: levelId,
            expectedPitch: options.pitch,
            expectedZoom: options.zoom,
            hasCenter: options.hasCenter ?? false,
            pitchTolerance: options.pitchTolerance ?? 0.1,
            zoomTolerance: options.zoomTolerance ?? 0.01,
        },
    );

export const grantTokens = (page: Page, levelId: string, count: number) =>
    callBridge<number, void>(page, levelId, 'grantTokens', count);

export const teleportToTeacher = (page: Page, levelId: string) =>
    callBridge<void, void>(page, levelId, 'teleportToTeacher');

export const teleportToFinalMilestone = (page: Page, levelId: string) =>
    callBridge<void, void>(page, levelId, 'teleportToFinalMilestone');

export const completeLevel = (page: Page, levelId: string) => callBridge<void, void>(page, levelId, 'completeLevel');

export const getMapView = (page: Page, levelId: string) =>
    callBridge<void, MapViewSnapshot | null>(page, levelId, 'getMapView');

export const getPerfSnapshot = (page: Page, levelId: string) =>
    callBridge<void, PerfSnapshot>(page, levelId, 'getPerfSnapshot');

export const getLastPerfSnapshot = (page: Page, levelId: string) =>
    callBridge<void, PerfSnapshot>(page, levelId, 'getLastPerfSnapshot');

export const resetPerfMetrics = (page: Page, levelId: string) =>
    callBridge<void, void>(page, levelId, 'resetPerfMetrics');

export const setMapView = (page: Page, levelId: string, view: MapViewUpdate) =>
    callBridge<MapViewUpdate, void>(page, levelId, 'setMapView', view);

export const simulatePerfFrames = (page: Page, levelId: string, options: PerfSimulationOptions) =>
    callBridge<PerfSimulationOptions, void>(page, levelId, 'simulatePerfFrames', options);
