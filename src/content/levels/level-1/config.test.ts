import { describe, expect, it } from 'vitest';
import { level1 } from '@/content/levels/level-1/config';
import { TEACHER_INTERACTION_RADIUS_METERS, TOKEN_COLLECTION_RADIUS_METERS } from '@/shared/constants/gameplay';
import { worldDistanceInMeters } from '@/shared/geo';

describe('level 1 authored spacing', () => {
    it('keeps teachers outside nearby token pickup overlap zones', () => {
        for (const teacher of level1.teachers) {
            for (const cluster of level1.hadithTokenClusters) {
                const distance = worldDistanceInMeters(teacher.coords, cluster.center);
                expect(distance).toBeGreaterThan(TEACHER_INTERACTION_RADIUS_METERS + TOKEN_COLLECTION_RADIUS_METERS);
            }
        }
    });
});
