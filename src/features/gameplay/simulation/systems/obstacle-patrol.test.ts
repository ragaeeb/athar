import { describe, expect, it } from 'vitest';

import type { ObstacleConfig } from '@/content/levels/types';
import { worldDistanceInMeters } from '@/shared/geo';

import { resolveObstaclePatrolCoords, resolveObstaclePatrolOffsetMeters } from './obstacle-patrol';

describe('obstacle patrol', () => {
    it('keeps stationary obstacles anchored at their authored coordinates', () => {
        const obstacle: ObstacleConfig = {
            coords: { lat: 23.36, lng: 39.01 },
            id: 'wadi-flood',
            label: 'Wadi Flood',
            radius: 60_000,
            type: 'flood',
        };

        expect(resolveObstaclePatrolOffsetMeters(obstacle, 25_000)).toEqual({ x: 0, z: 0 });
        expect(resolveObstaclePatrolCoords(obstacle, 25_000)).toEqual(obstacle.coords);
    });

    it('moves patrolling obstacles along a deterministic orbit', () => {
        const obstacle: ObstacleConfig = {
            coords: { lat: 24.14, lng: 39.32 },
            id: 'guard-patrol',
            label: 'Corrupt Guard',
            patrolRadius: 20_000,
            radius: 44_000,
            type: 'guard',
        };

        const start = resolveObstaclePatrolCoords(obstacle, 0);
        const later = resolveObstaclePatrolCoords(obstacle, 8_000);

        expect(worldDistanceInMeters(start, obstacle.coords)).toBeCloseTo(obstacle.patrolRadius!, -2);
        expect(worldDistanceInMeters(later, obstacle.coords)).toBeCloseTo(obstacle.patrolRadius!, -2);
        expect(worldDistanceInMeters(start, later)).toBeGreaterThan(1_000);
    });
});
