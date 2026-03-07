import { describe, expect, it } from 'vitest';

import { level1 } from '@/content/levels/level-1/config';
import { getOriginRebaseDelta, getRouteEndpointDistance, offsetCoords, worldDistanceInMeters } from '@/shared/geo';

describe('shared geo helpers', () => {
    it('keeps origin rebasing precise across the full level one route extent', () => {
        const destination = level1.milestones[level1.milestones.length - 1]?.coords ?? level1.origin;
        const routeDistance = getRouteEndpointDistance(level1.origin, destination);
        const rebased = offsetCoords(level1.origin, getOriginRebaseDelta(level1.origin, destination));

        expect(routeDistance).toBeGreaterThan(3_000_000);
        expect(worldDistanceInMeters(destination, rebased)).toBeLessThan(1);
    });
});
