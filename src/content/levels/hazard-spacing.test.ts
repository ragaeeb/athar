import { describe, expect, it } from 'vitest';
import { level1 } from '@/content/levels/level-1/config';
import { level2 } from '@/content/levels/level-2/config';
import { level3 } from '@/content/levels/level-3/config';
import { level4 } from '@/content/levels/level-4/config';
import { level5 } from '@/content/levels/level-5/config';
import {
    COMPLETED_MILESTONE_SAFE_ZONE_RADIUS_METERS,
    OBSTACLE_TRIGGER_RADIUS_METERS,
} from '@/shared/constants/gameplay';
import { worldDistanceInMeters } from '@/shared/geo';

describe('authored hazard spacing', () => {
    for (const level of [level1, level2, level3, level4, level5]) {
        it(`keeps hazards outside completed milestone sanctuary space for ${level.id}`, () => {
            for (const obstacle of level.obstacles) {
                for (const milestone of level.milestones) {
                    const distance = worldDistanceInMeters(obstacle.coords, milestone.coords);
                    expect(distance).toBeGreaterThan(COMPLETED_MILESTONE_SAFE_ZONE_RADIUS_METERS);
                }
            }
        });
    }

    it('keeps the level 2 rival corridor and flood as distinct hazards', () => {
        const rival = level2.obstacles.find((obstacle) => obstacle.id === 'rival-juhfa-corridor');
        const flood = level2.obstacles.find((obstacle) => obstacle.id === 'wadi-flood');

        expect(rival).toBeDefined();
        expect(flood).toBeDefined();

        if (!rival || !flood) {
            return;
        }

        const rivalRadius = rival.radius ?? OBSTACLE_TRIGGER_RADIUS_METERS;
        const floodRadius = flood.radius ?? OBSTACLE_TRIGGER_RADIUS_METERS;
        const distance = worldDistanceInMeters(rival.coords, flood.coords);

        expect(distance).toBeGreaterThan(rivalRadius + floodRadius);
    });
});
