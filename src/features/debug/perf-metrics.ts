import type { Coords } from '@/content/levels/types';

export type MapViewSnapshot = {
    bearing: number | null;
    center: Coords | null;
    pitch: number | null;
    zoom: number | null;
};

export type PerfSnapshot = {
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
    map: MapViewSnapshot & {
        manualInteractionCount: number;
    };
    player: {
        locationWriteCount: number;
        movementTickCount: number;
    };
};

type MapViewController = {
    getMapView: () => MapViewSnapshot;
    jumpToMapView: (view: Partial<{ bearing: number; center: Coords; pitch: number; zoom: number }>) => void;
    setMapView: (view: Partial<{ bearing: number; center: Coords; pitch: number; zoom: number }>) => void;
};

const PERF_SAMPLE_CAP = 300;

const shouldTrackPerfMetrics = import.meta.env.DEV || import.meta.env.MODE === 'test';

const state: PerfSnapshot = {
    camera: {
        followCount: 0,
        maxAppliedStepMeters: 0,
        maxDistanceFromTargetMeters: 0,
        skippedDuringCooldownCount: 0,
    },
    frame: {
        count: 0,
        longFramesOver34Ms: 0,
        longFramesOver50Ms: 0,
        longFramesOver100Ms: 0,
        maxDeltaMs: 0,
        p50DeltaMs: 0,
        p95DeltaMs: 0,
    },
    map: {
        bearing: null,
        center: null,
        manualInteractionCount: 0,
        pitch: null,
        zoom: null,
    },
    player: {
        locationWriteCount: 0,
        movementTickCount: 0,
    },
};

const frameSamplesMs: number[] = [];
let lastManualMapInteractionAt = 0;
let mapViewController: MapViewController | null = null;

const nearestRankPercentile = (values: number[], percentile: number) => {
    if (values.length === 0) {
        return 0;
    }

    const sorted = [...values].sort((left, right) => left - right);
    const rawIndex = Math.ceil(sorted.length * percentile) - 1;
    const index = Math.min(sorted.length - 1, Math.max(0, rawIndex));
    return sorted[index] ?? 0;
};

const pushBoundedSample = (value: number) => {
    frameSamplesMs.push(value);
    if (frameSamplesMs.length > PERF_SAMPLE_CAP) {
        frameSamplesMs.shift();
    }
};

const cloneCenter = (center: Coords | null) => (center ? { ...center } : null);

export const recordFrameDeltaMs = (deltaMs: number) => {
    if (!shouldTrackPerfMetrics) {
        return;
    }

    pushBoundedSample(deltaMs);
    state.frame.count += 1;
    state.frame.maxDeltaMs = Math.max(state.frame.maxDeltaMs, deltaMs);

    if (deltaMs > 34) {
        state.frame.longFramesOver34Ms += 1;
    }
    if (deltaMs > 50) {
        state.frame.longFramesOver50Ms += 1;
    }
    if (deltaMs > 100) {
        state.frame.longFramesOver100Ms += 1;
    }
};

export const recordCameraFollow = ({
    appliedStepMeters,
    distanceFromTargetMeters,
}: {
    appliedStepMeters: number;
    distanceFromTargetMeters: number;
}) => {
    if (!shouldTrackPerfMetrics) {
        return;
    }

    state.camera.followCount += 1;
    state.camera.maxAppliedStepMeters = Math.max(state.camera.maxAppliedStepMeters, appliedStepMeters);
    state.camera.maxDistanceFromTargetMeters = Math.max(
        state.camera.maxDistanceFromTargetMeters,
        distanceFromTargetMeters,
    );
};

export const recordCameraFollowCooldownSkip = () => {
    if (!shouldTrackPerfMetrics) {
        return;
    }

    state.camera.skippedDuringCooldownCount += 1;
};

export const recordPlayerMovementTick = () => {
    if (!shouldTrackPerfMetrics) {
        return;
    }

    state.player.movementTickCount += 1;
};

export const recordPlayerLocationWrite = () => {
    if (!shouldTrackPerfMetrics) {
        return;
    }

    state.player.locationWriteCount += 1;
};

export const updateMapViewSnapshot = (view: MapViewSnapshot) => {
    if (!shouldTrackPerfMetrics) {
        return;
    }

    state.map.center = cloneCenter(view.center);
    state.map.zoom = view.zoom;
    state.map.pitch = view.pitch;
    state.map.bearing = view.bearing;
};

export const recordManualMapInteraction = (now = performance.now()) => {
    lastManualMapInteractionAt = now;

    if (shouldTrackPerfMetrics) {
        state.map.manualInteractionCount += 1;
    }
};

export const getLastManualMapInteractionAt = () => lastManualMapInteractionAt;

export const resetPerfMetrics = () => {
    if (!shouldTrackPerfMetrics) {
        return;
    }

    frameSamplesMs.length = 0;
    lastManualMapInteractionAt = 0;

    state.camera.followCount = 0;
    state.camera.maxAppliedStepMeters = 0;
    state.camera.maxDistanceFromTargetMeters = 0;
    state.camera.skippedDuringCooldownCount = 0;

    state.frame.count = 0;
    state.frame.longFramesOver34Ms = 0;
    state.frame.longFramesOver50Ms = 0;
    state.frame.longFramesOver100Ms = 0;
    state.frame.maxDeltaMs = 0;
    state.frame.p50DeltaMs = 0;
    state.frame.p95DeltaMs = 0;

    state.map.manualInteractionCount = 0;

    state.player.locationWriteCount = 0;
    state.player.movementTickCount = 0;
};

export const getPerfSnapshot = (): PerfSnapshot => {
    const p50DeltaMs = nearestRankPercentile(frameSamplesMs, 0.5);
    const p95DeltaMs = nearestRankPercentile(frameSamplesMs, 0.95);

    return {
        camera: { ...state.camera },
        frame: {
            ...state.frame,
            p50DeltaMs,
            p95DeltaMs,
        },
        map: {
            ...state.map,
            center: cloneCenter(state.map.center),
        },
        player: { ...state.player },
    };
};

export const setPerfMapViewController = (controller: MapViewController | null) => {
    if (!shouldTrackPerfMetrics) {
        return;
    }

    mapViewController = controller;
};

export const getPerfMapViewController = () => mapViewController;
