import type { Coords } from '@/content/levels/types';

export type {
    MovementStepInput,
    MovementStepResult,
} from '@/features/gameplay/simulation/systems/movement-utils';
export { resolveMovementStep } from '@/features/gameplay/simulation/systems/movement-utils';

import { worldDistanceInMeters } from '@/shared/geo';

export type CameraFollowInput = {
    currentCenter: Coords;
    damping: number;
    deadzoneMeters: number;
    delta: number;
    immediate?: boolean;
    maxSpeedMetersPerSecond: number;
    targetCoords: Coords;
};

export type CameraFollowResult = {
    appliedStepMeters: number;
    distanceFromCamera: number;
    moved: boolean;
    nextCenter: Coords;
};

export type CameraFollowPermissionInput = {
    cooldownMs: number;
    lastManualInteractionAt: number;
    now: number;
};

export const shouldAutoFollowCamera = ({ cooldownMs, lastManualInteractionAt, now }: CameraFollowPermissionInput) =>
    now - lastManualInteractionAt >= cooldownMs;

export const resolveCameraFollow = ({
    currentCenter,
    damping,
    deadzoneMeters,
    delta,
    immediate = false,
    maxSpeedMetersPerSecond,
    targetCoords,
}: CameraFollowInput): CameraFollowResult => {
    const distanceFromCamera = worldDistanceInMeters(targetCoords, currentCenter);

    if (!immediate && distanceFromCamera <= deadzoneMeters) {
        return {
            appliedStepMeters: 0,
            distanceFromCamera,
            moved: false,
            nextCenter: currentCenter,
        };
    }

    if (distanceFromCamera === 0) {
        return {
            appliedStepMeters: 0,
            distanceFromCamera,
            moved: false,
            nextCenter: currentCenter,
        };
    }

    if (immediate) {
        return {
            appliedStepMeters: distanceFromCamera,
            distanceFromCamera,
            moved: true,
            nextCenter: targetCoords,
        };
    }

    const desiredStepMeters = distanceFromCamera * (1 - Math.exp(-delta * damping));
    const maxStepMeters = Math.max(maxSpeedMetersPerSecond * delta, 0);
    const appliedStepMeters = Math.min(distanceFromCamera, desiredStepMeters, maxStepMeters);

    if (appliedStepMeters <= 0) {
        return {
            appliedStepMeters: 0,
            distanceFromCamera,
            moved: false,
            nextCenter: currentCenter,
        };
    }

    const stepRatio = appliedStepMeters / distanceFromCamera;
    const latStep = (targetCoords.lat - currentCenter.lat) * stepRatio;
    const lngStep = (targetCoords.lng - currentCenter.lng) * stepRatio;

    return {
        appliedStepMeters,
        distanceFromCamera,
        moved: true,
        nextCenter: {
            lat: currentCenter.lat + latStep,
            lng: currentCenter.lng + lngStep,
        },
    };
};
