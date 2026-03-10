import { beforeEach, describe, expect, test } from 'vitest';
import { commitSimulationSample, drainForPresentation, resetSimulationBridge } from './simulation-bridge';

const sample = (z: number, speed = 54_000) => ({
    bearing: 0,
    coords: { lat: 39.77, lng: 64.43 },
    positionMeters: { x: 0, z },
    speed,
});

describe('SimulationBridge', () => {
    beforeEach(() => {
        resetSimulationBridge();
    });

    test('returns null before any commit', () => {
        expect(drainForPresentation(-1)).toBeNull();
    });

    test('returns current state after commit', () => {
        commitSimulationSample(sample(100, 54_000));
        const result = drainForPresentation(-1);
        expect(result).not.toBeNull();
        expect(result!.state.positionMeters.z).toBe(100);
        expect(result!.state.speed).toBe(54_000);
        expect(result!.sequence).toBe(1);
    });

    test('returns null when the latest sequence was already rendered', () => {
        commitSimulationSample(sample(100));

        const firstDrain = drainForPresentation(-1);

        expect(firstDrain).not.toBeNull();
        expect(drainForPresentation(firstDrain!.sequence)).toBeNull();
    });

    test('returns the next committed sample once the sequence advances', () => {
        commitSimulationSample(sample(100));
        const firstDrain = drainForPresentation(-1);

        commitSimulationSample(sample(200));
        const secondDrain = drainForPresentation(firstDrain!.sequence);

        expect(secondDrain).not.toBeNull();
        expect(secondDrain!.sequence).toBe(2);
        expect(secondDrain!.state.positionMeters.z).toBe(200);
    });

    test('sequence increments on each commit', () => {
        commitSimulationSample(sample(0));
        commitSimulationSample(sample(100));
        commitSimulationSample(sample(200));
        const result = drainForPresentation(-1);
        expect(result!.sequence).toBe(3);
        expect(result!.state.positionMeters.z).toBe(200);
    });

    test('reset clears the bridge', () => {
        commitSimulationSample(sample(100));
        resetSimulationBridge();
        expect(drainForPresentation(-1)).toBeNull();
    });
});
