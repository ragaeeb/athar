import type { Coords, MeterOffset } from '@/content/levels/types';
import { offsetCoords } from '@/shared/geo';

export type MovementStepInput = {
    delta: number;
    moveX: number;
    moveZ: number;
    origin: Coords;
    positionMeters: MeterOffset;
    scrambleMultiplier: number;
    speed: number;
};

export type MovementStepResult = {
    bearing: number;
    distanceMeters: number;
    nextCoords: Coords;
    nextPositionMeters: MeterOffset;
};

export const resolveMovementStep = ({
    delta,
    moveX,
    moveZ,
    origin,
    positionMeters,
    scrambleMultiplier,
    speed,
}: MovementStepInput): MovementStepResult => {
    if (moveX === 0 && moveZ === 0) {
        return {
            bearing: 0,
            distanceMeters: 0,
            nextCoords: offsetCoords(origin, positionMeters),
            nextPositionMeters: { ...positionMeters },
        };
    }

    const bearing = Math.atan2(moveX * scrambleMultiplier, moveZ);
    const distanceMeters = speed * delta;
    const nextPositionMeters = {
        x: positionMeters.x + Math.sin(bearing) * distanceMeters,
        z: positionMeters.z + Math.cos(bearing) * distanceMeters,
    };

    return {
        bearing,
        distanceMeters,
        nextCoords: offsetCoords(origin, nextPositionMeters),
        nextPositionMeters,
    };
};
