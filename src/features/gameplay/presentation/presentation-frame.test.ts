import { describe, expect, it } from 'vitest';
import type { Coords } from '@/content/levels/types';
import {
    buildPresentationMotionFrame,
    type PresentationMotionState,
    resolvePresentationCameraFollowDecision,
} from './presentation-frame';

const center: Coords = {
    lat: 39.77,
    lng: 64.43,
};

const offsetCenter: Coords = {
    lat: 39.78,
    lng: 64.45,
};

const emptyMotionState = (): PresentationMotionState => ({
    lastMapCenter: null,
    lastPlayerLocalPosition: null,
    lastPlayerScreenPosition: null,
    lastPlayerWorldPosition: null,
});

describe('resolvePresentationCameraFollowDecision', () => {
    it('commits a camera move when follow is enabled, the target moved, and cooldown elapsed', () => {
        const decision = resolvePresentationCameraFollowDecision({
            autoFollowEnabled: true,
            currentCenter: center,
            followCorrection: { moved: true },
            lastCameraCommitAtMs: 100,
            manualCameraOverrideActive: false,
            nextCenter: offsetCenter,
            nowMs: 500,
            staticCameraMode: false,
            targetCoords: offsetCenter,
        });

        expect(decision.shouldCommitCamera).toBe(true);
        expect(decision.recordedCenter).toEqual(offsetCenter);
        expect(decision.cameraCommitStepMeters).toBeGreaterThan(0);
        expect(decision.shouldRecordCooldownSkip).toBe(false);
    });

    it('does not commit while the follow cooldown is still active', () => {
        const decision = resolvePresentationCameraFollowDecision({
            autoFollowEnabled: true,
            currentCenter: center,
            followCorrection: { moved: true },
            lastCameraCommitAtMs: 300,
            manualCameraOverrideActive: false,
            nextCenter: offsetCenter,
            nowMs: 500,
            staticCameraMode: false,
            targetCoords: offsetCenter,
        });

        expect(decision.shouldCommitCamera).toBe(false);
        expect(decision.recordedCenter).toEqual(center);
        expect(decision.cameraCommitStepMeters).toBe(0);
        expect(decision.shouldRecordCooldownSkip).toBe(false);
    });

    it('keeps manual override active while still reporting a cooldown skip', () => {
        const decision = resolvePresentationCameraFollowDecision({
            autoFollowEnabled: true,
            currentCenter: center,
            followCorrection: { moved: true },
            lastCameraCommitAtMs: 0,
            manualCameraOverrideActive: true,
            nextCenter: offsetCenter,
            nowMs: 500,
            staticCameraMode: false,
            targetCoords: offsetCenter,
        });

        expect(decision.shouldCommitCamera).toBe(false);
        expect(decision.shouldClearManualOverride).toBe(false);
        expect(decision.shouldRecordCooldownSkip).toBe(true);
    });

    it('clears manual override once the player is back inside the deadzone', () => {
        const decision = resolvePresentationCameraFollowDecision({
            autoFollowEnabled: true,
            currentCenter: center,
            followCorrection: { moved: false },
            lastCameraCommitAtMs: 0,
            manualCameraOverrideActive: true,
            nextCenter: center,
            nowMs: 500,
            staticCameraMode: false,
            targetCoords: center,
        });

        expect(decision.shouldClearManualOverride).toBe(true);
        expect(decision.shouldCommitCamera).toBe(false);
        expect(decision.shouldRecordCooldownSkip).toBe(true);
    });

    it('records a cooldown skip when auto follow is disabled outside static camera mode', () => {
        const decision = resolvePresentationCameraFollowDecision({
            autoFollowEnabled: false,
            currentCenter: center,
            followCorrection: { moved: false },
            lastCameraCommitAtMs: 0,
            manualCameraOverrideActive: false,
            nextCenter: center,
            nowMs: 500,
            staticCameraMode: false,
            targetCoords: center,
        });

        expect(decision.shouldRecordCooldownSkip).toBe(true);
        expect(decision.shouldCommitCamera).toBe(false);
    });
});

describe('buildPresentationMotionFrame', () => {
    it('initializes motion metrics without synthetic movement on the first frame', () => {
        const { frame, nextState } = buildPresentationMotionFrame(
            {
                cameraCommitStepMeters: 0,
                frameDeltaMs: 16.67,
                jumpToDurationMs: -1,
                localPosition: { x: 10, z: 25 },
                mapCenter: center,
                playerScreenPosition: { x: 640, y: 320 },
                playerWorldPosition: { x: 10, y: 0, z: 25 },
                sequence: 3,
                speed: 54_000,
                timestampMs: 1_000,
                viewportHeight: 720,
                viewportWidth: 1_280,
            },
            emptyMotionState(),
        );

        expect(frame.localStepMeters).toBe(0);
        expect(frame.worldStepMeters).toBe(0);
        expect(frame.cameraCenterStepMeters).toBe(0);
        expect(frame.screenStepPx).toBe(0);
        expect(frame.screenOffsetPx).toBeCloseTo(40, 5);
        expect(nextState.lastMapCenter).toEqual(center);
    });

    it('measures deltas from the previously rendered frame', () => {
        const first = buildPresentationMotionFrame(
            {
                cameraCommitStepMeters: 0,
                frameDeltaMs: 16.67,
                jumpToDurationMs: -1,
                localPosition: { x: 10, z: 25 },
                mapCenter: center,
                playerScreenPosition: { x: 640, y: 320 },
                playerWorldPosition: { x: 10, y: 0, z: 25 },
                sequence: 3,
                speed: 54_000,
                timestampMs: 1_000,
                viewportHeight: 720,
                viewportWidth: 1_280,
            },
            emptyMotionState(),
        );
        const second = buildPresentationMotionFrame(
            {
                cameraCommitStepMeters: 150,
                frameDeltaMs: 16.67,
                jumpToDurationMs: 2.5,
                localPosition: { x: 25, z: 45 },
                mapCenter: offsetCenter,
                playerScreenPosition: { x: 700, y: 360 },
                playerWorldPosition: { x: 24, y: 0, z: 45 },
                sequence: 4,
                speed: 54_000,
                timestampMs: 1_016.67,
                viewportHeight: 720,
                viewportWidth: 1_280,
            },
            first.nextState,
        );

        expect(second.frame.localStepMeters).toBeCloseTo(25, 5);
        expect(second.frame.worldStepMeters).toBeCloseTo(Math.hypot(14, 20), 5);
        expect(second.frame.cameraCenterStepMeters).toBeGreaterThan(0);
        expect(second.frame.screenStepPx).toBeCloseTo(Math.hypot(60, 40), 5);
        expect(second.frame.cameraCommitStepMeters).toBe(150);
        expect(second.frame.jumpToDurationMs).toBe(2.5);
    });
});
