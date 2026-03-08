import { coordsToVector3 } from 'react-three-map/maplibre';
import { describe, expect, it } from 'vitest';

import { offsetCoords } from '@/shared/geo';

import { positionMetersToPlayerLocalPosition } from './player-local-position';

const origin = { lat: 39.77, lng: 64.43 };

describe('positionMetersToPlayerLocalPosition', () => {
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
            const [actualX, actualY, actualZ] = positionMetersToPlayerLocalPosition(positionMeters);

            expect(Math.abs(actualX - expectedX)).toBeLessThan(2);
            expect(actualY).toBe(expectedY);
            expect(Math.abs(actualZ - expectedZ)).toBeLessThan(2);
        }
    });
});
