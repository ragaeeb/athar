import type { Coords } from '@/content/levels/types';
import type { MotionDiagnosticFrame } from '@/features/debug/motion-diagnostics';
import { worldDistanceInMeters } from '@/shared/geo';

type CameraFollowCorrection = {
    moved: boolean;
};

export type CameraFollowDecision = {
    cameraCommitStepMeters: number;
    distanceFromTargetMeters: number;
    recordedCenter: Coords;
    shouldClearManualOverride: boolean;
    shouldCommitCamera: boolean;
    shouldRecordCooldownSkip: boolean;
};

type ResolveCameraFollowDecisionOptions = {
    autoFollowEnabled: boolean;
    currentCenter: Coords;
    followCorrection: CameraFollowCorrection;
    lastCameraCommitAtMs: number;
    manualCameraOverrideActive: boolean;
    nextCenter: Coords;
    nowMs: number;
    staticCameraMode: boolean;
    targetCoords: Coords;
};

export type PresentationMotionState = {
    lastMapCenter: Coords | null;
    lastPlayerLocalPosition: { x: number; z: number } | null;
    lastPlayerScreenPosition: { x: number; y: number } | null;
    lastPlayerWorldPosition: { x: number; y: number; z: number } | null;
};

type BuildPresentationMotionFrameOptions = {
    cameraCommitStepMeters: number;
    frameDeltaMs: number;
    jumpToDurationMs: number;
    localPosition: { x: number; z: number };
    mapCenter: Coords;
    playerScreenPosition: { x: number; y: number };
    playerWorldPosition: { x: number; y: number; z: number };
    sequence: number;
    speed: number;
    timestampMs: number;
    viewportHeight: number;
    viewportWidth: number;
};

export const resolvePresentationCameraFollowDecision = ({
    autoFollowEnabled,
    currentCenter,
    followCorrection,
    lastCameraCommitAtMs,
    manualCameraOverrideActive,
    nextCenter,
    nowMs,
    staticCameraMode,
    targetCoords,
}: ResolveCameraFollowDecisionOptions): CameraFollowDecision => {
    const shouldClearManualOverride = manualCameraOverrideActive && !followCorrection.moved;
    const shouldRecordCooldownSkip = !staticCameraMode && (!autoFollowEnabled || manualCameraOverrideActive);
    const distanceFromTargetMeters = worldDistanceInMeters(currentCenter, targetCoords);
    const shouldCommitCamera =
        autoFollowEnabled &&
        !manualCameraOverrideActive &&
        followCorrection.moved &&
        distanceFromTargetMeters > 0 &&
        nowMs - lastCameraCommitAtMs >= 280;

    return {
        cameraCommitStepMeters: shouldCommitCamera ? worldDistanceInMeters(nextCenter, currentCenter) : 0,
        distanceFromTargetMeters,
        recordedCenter: shouldCommitCamera ? nextCenter : currentCenter,
        shouldClearManualOverride,
        shouldCommitCamera,
        shouldRecordCooldownSkip,
    };
};

const distance3D = (left: { x: number; y: number; z: number }, right: { x: number; y: number; z: number }) =>
    Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);

export const buildPresentationMotionFrame = (
    {
        cameraCommitStepMeters,
        frameDeltaMs,
        jumpToDurationMs,
        localPosition,
        mapCenter,
        playerScreenPosition,
        playerWorldPosition,
        sequence,
        speed,
        timestampMs,
        viewportHeight,
        viewportWidth,
    }: BuildPresentationMotionFrameOptions,
    state: PresentationMotionState,
): { frame: MotionDiagnosticFrame; nextState: PresentationMotionState } => {
    const localStepMeters = state.lastPlayerLocalPosition
        ? Math.hypot(
              localPosition.x - state.lastPlayerLocalPosition.x,
              localPosition.z - state.lastPlayerLocalPosition.z,
          )
        : 0;
    const worldStepMeters = state.lastPlayerWorldPosition
        ? distance3D(playerWorldPosition, state.lastPlayerWorldPosition)
        : 0;
    const cameraCenterStepMeters = state.lastMapCenter ? worldDistanceInMeters(mapCenter, state.lastMapCenter) : 0;
    const screenCenter = {
        x: viewportWidth / 2,
        y: viewportHeight / 2,
    };
    const screenOffsetPx = Math.hypot(playerScreenPosition.x - screenCenter.x, playerScreenPosition.y - screenCenter.y);
    const screenStepPx = state.lastPlayerScreenPosition
        ? Math.hypot(
              playerScreenPosition.x - state.lastPlayerScreenPosition.x,
              playerScreenPosition.y - state.lastPlayerScreenPosition.y,
          )
        : 0;

    return {
        frame: {
            cameraCenterStepMeters,
            cameraCommitStepMeters,
            frameDeltaMs,
            jumpToDurationMs,
            localStepMeters,
            screenOffsetPx,
            screenStepPx,
            sequence,
            speed,
            timestampMs,
            worldStepMeters,
        },
        nextState: {
            lastMapCenter: mapCenter,
            lastPlayerLocalPosition: localPosition,
            lastPlayerScreenPosition: playerScreenPosition,
            lastPlayerWorldPosition: playerWorldPosition,
        },
    };
};
