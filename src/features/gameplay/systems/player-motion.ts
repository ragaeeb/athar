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

export type CameraSnapFollowInput = {
    currentCenter: Coords;
    deadzoneMeters: number;
    targetCoords: Coords;
};

export type ScreenSpaceFollowCorrectionInput = {
    minimumCorrectionPx?: number;
    point: { x: number; y: number };
    viewportHeight: number;
    viewportWidth: number;
    deadzoneXFraction: number;
    deadzoneYFraction: number;
};

export type ScreenSpaceFollowCorrectionResult = {
    cameraDeltaPx: { x: number; y: number };
    correctionMagnitudePx: number;
    moved: boolean;
    targetPoint: { x: number; y: number };
};

export const shouldAutoFollowCamera = ({ cooldownMs, lastManualInteractionAt, now }: CameraFollowPermissionInput) =>
    now - lastManualInteractionAt >= cooldownMs;

export const resolveScreenSpaceFollowCorrection = ({
    point,
    minimumCorrectionPx = 0,
    viewportHeight,
    viewportWidth,
    deadzoneXFraction,
    deadzoneYFraction,
}: ScreenSpaceFollowCorrectionInput): ScreenSpaceFollowCorrectionResult => {
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const maxOffsetX = viewportWidth * deadzoneXFraction;
    const maxOffsetY = viewportHeight * deadzoneYFraction;
    const targetPoint = {
        x: Math.min(centerX + maxOffsetX, Math.max(centerX - maxOffsetX, point.x)),
        y: Math.min(centerY + maxOffsetY, Math.max(centerY - maxOffsetY, point.y)),
    };
    const cameraDeltaPx = {
        x: point.x - targetPoint.x,
        y: point.y - targetPoint.y,
    };
    const correctionMagnitudePx = Math.hypot(cameraDeltaPx.x, cameraDeltaPx.y);
    const moved = correctionMagnitudePx > 0 && correctionMagnitudePx >= minimumCorrectionPx;

    return {
        cameraDeltaPx: moved ? cameraDeltaPx : { x: 0, y: 0 },
        correctionMagnitudePx,
        moved,
        targetPoint: moved ? targetPoint : point,
    };
};

export const resolveCameraSnapFollow = ({
    currentCenter,
    deadzoneMeters,
    targetCoords,
}: CameraSnapFollowInput): CameraFollowResult => {
    const distanceFromCamera = worldDistanceInMeters(targetCoords, currentCenter);

    if (distanceFromCamera === 0 || distanceFromCamera <= deadzoneMeters) {
        return {
            appliedStepMeters: 0,
            distanceFromCamera,
            moved: false,
            nextCenter: currentCenter,
        };
    }

    return {
        appliedStepMeters: distanceFromCamera,
        distanceFromCamera,
        moved: true,
        nextCenter: targetCoords,
    };
};

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
