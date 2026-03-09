import { coordsToVector3 } from 'react-three-map/maplibre';
import { describe, expect, it } from 'vitest';

import { level1 } from '@/content/levels/level-1/config';
import { offsetCoords } from '@/shared/geo';

import { coordsToPlayerLocalPosition } from './player-local-position';

const origin = { lat: 39.77, lng: 64.43 };

describe('coordsToPlayerLocalPosition', () => {
    it('matches react-three-map local projection near the chapter origin', () => {
        const samples = [
            { x: 0, z: 1_000 },
            { x: 1_000, z: 0 },
            { x: 1_500, z: 1_200 },
            { x: -800, z: 2_000 },
        ];

        for (const positionMeters of samples) {
            const coords = offsetCoords(origin, positionMeters);
            const [expectedX, expectedY, expectedZ] = coordsToVector3(
                { latitude: coords.lat, longitude: coords.lng },
                { latitude: origin.lat, longitude: origin.lng },
            );
            const [actualX, actualY, actualZ] = coordsToPlayerLocalPosition(coords, origin);

            expect(Math.abs(actualX - expectedX)).toBeLessThan(2);
            expect(actualY).toBe(expectedY);
            expect(Math.abs(actualZ - expectedZ)).toBeLessThan(2);
        }
    });

    it('matches react-three-map at the far end of the level one route', () => {
        const finalMilestone = level1.milestones.find(
            (milestone) => milestone.id === level1.winCondition.finalMilestone,
        );
        expect(finalMilestone).toBeDefined();

        const [expectedX, expectedY, expectedZ] = coordsToVector3(
            { latitude: finalMilestone!.coords.lat, longitude: finalMilestone!.coords.lng },
            { latitude: level1.origin.lat, longitude: level1.origin.lng },
        );
        const [actualX, actualY, actualZ] = coordsToPlayerLocalPosition(finalMilestone!.coords, level1.origin);

        expect(Math.abs(actualX - expectedX)).toBeLessThan(0.001);
        expect(actualY).toBe(expectedY);
        expect(Math.abs(actualZ - expectedZ)).toBeLessThan(0.001);
    });
});
