import { beforeEach, describe, expect, it } from 'vitest';

import { getPerfSnapshot, resetPerfMetrics } from '@/features/debug/perf-metrics';
import { resetPlayerStore, usePlayerStore } from '@/features/gameplay/state/player.store';

describe('player store perf safety', () => {
    beforeEach(() => {
        resetPlayerStore();
        resetPerfMetrics();
    });

    it('treats repeated identical setLocation calls as no-ops', () => {
        let updates = 0;
        const unsubscribe = usePlayerStore.subscribe(() => {
            updates += 1;
        });

        const initialState = usePlayerStore.getState();
        usePlayerStore.getState().setLocation(initialState.coords, initialState.positionMeters);

        unsubscribe();

        expect(updates).toBe(0);
        expect(getPerfSnapshot().player.locationWriteCount).toBe(0);
    });

    it('increments perf metrics only when location actually changes', () => {
        let updates = 0;
        const unsubscribe = usePlayerStore.subscribe(() => {
            updates += 1;
        });

        usePlayerStore.getState().setLocation(
            { lat: 39.7705, lng: 64.4305 },
            {
                x: 50,
                z: 40,
            },
        );

        usePlayerStore.getState().setLocation(
            { lat: 39.7705, lng: 64.4305 },
            {
                x: 50,
                z: 40,
            },
        );

        unsubscribe();

        expect(updates).toBe(1);
        expect(getPerfSnapshot().player.locationWriteCount).toBe(1);
    });

    it('treats repeated identical bearing and speed writes as no-ops', () => {
        let updates = 0;
        const unsubscribe = usePlayerStore.subscribe(() => {
            updates += 1;
        });

        usePlayerStore.getState().setBearingAndSpeed(0, 0);
        usePlayerStore.getState().setBearingAndSpeed(Math.PI / 2, 1_000);
        usePlayerStore.getState().setBearingAndSpeed(Math.PI / 2, 1_000);

        unsubscribe();

        expect(updates).toBe(1);
        expect(usePlayerStore.getState().bearing).toBe(Math.PI / 2);
        expect(usePlayerStore.getState().speed).toBe(1_000);
    });
});
