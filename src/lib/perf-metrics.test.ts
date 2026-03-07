import { beforeEach, describe, expect, it } from 'vitest';

import {
    getPerfSnapshot,
    recordCameraFollow,
    recordCameraFollowCooldownSkip,
    recordFrameDeltaMs,
    recordManualMapInteraction,
    recordPlayerLocationWrite,
    recordPlayerMovementTick,
    resetPerfMetrics,
    updateMapViewSnapshot,
} from '@/lib/perf-metrics';

describe('perf metrics', () => {
    beforeEach(() => {
        resetPerfMetrics();
        updateMapViewSnapshot({
            bearing: null,
            center: null,
            pitch: null,
            zoom: null,
        });
    });

    it('caps the frame sample ring buffer when more than 300 samples are recorded', () => {
        for (let index = 1; index <= 305; index += 1) {
            recordFrameDeltaMs(index);
        }

        const snapshot = getPerfSnapshot();

        expect(snapshot.frame.count).toBe(305);
        expect(snapshot.frame.maxDeltaMs).toBe(305);
        expect(snapshot.frame.p50DeltaMs).toBe(155);
        expect(snapshot.frame.p95DeltaMs).toBe(290);
    });

    it('computes frame percentiles, max, and long-frame buckets from the collected samples', () => {
        [12, 20, 35, 51, 120].forEach((sample) => {
            recordFrameDeltaMs(sample);
        });

        const snapshot = getPerfSnapshot();

        expect(snapshot.frame.count).toBe(5);
        expect(snapshot.frame.p50DeltaMs).toBe(35);
        expect(snapshot.frame.p95DeltaMs).toBe(120);
        expect(snapshot.frame.maxDeltaMs).toBe(120);
        expect(snapshot.frame.longFramesOver34Ms).toBe(3);
        expect(snapshot.frame.longFramesOver50Ms).toBe(2);
        expect(snapshot.frame.longFramesOver100Ms).toBe(1);
    });

    it('reset clears counters and frame samples while preserving only the latest map view state', () => {
        recordFrameDeltaMs(60);
        recordCameraFollow({ appliedStepMeters: 40, distanceFromTargetMeters: 120 });
        recordCameraFollowCooldownSkip();
        recordPlayerMovementTick();
        recordPlayerLocationWrite();
        recordManualMapInteraction(123);
        updateMapViewSnapshot({
            bearing: 28,
            center: { lat: 39.77, lng: 64.43 },
            pitch: 62,
            zoom: 7.4,
        });

        resetPerfMetrics();

        const snapshot = getPerfSnapshot();

        expect(snapshot.frame.count).toBe(0);
        expect(snapshot.frame.p50DeltaMs).toBe(0);
        expect(snapshot.frame.p95DeltaMs).toBe(0);
        expect(snapshot.camera.followCount).toBe(0);
        expect(snapshot.camera.skippedDuringCooldownCount).toBe(0);
        expect(snapshot.player.movementTickCount).toBe(0);
        expect(snapshot.player.locationWriteCount).toBe(0);
        expect(snapshot.map.manualInteractionCount).toBe(0);
        expect(snapshot.map.center).toEqual({ lat: 39.77, lng: 64.43 });
        expect(snapshot.map.zoom).toBe(7.4);
    });
});
