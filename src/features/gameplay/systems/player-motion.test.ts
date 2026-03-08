import { describe, expect, it } from 'vitest';

import { level1 } from '@/content/levels/level-1/config';
import { worldDistanceInMeters } from '@/features/map/lib/geo';

import {
    resolveCameraFollow,
    resolveCameraSnapFollow,
    resolveMovementStep,
    resolveScreenSpaceFollowCorrection,
    shouldAutoFollowCamera,
} from './player-motion';

const simulateScreenSpaceFollowTrace = ({
    cooldownMs,
    deadzoneXFraction,
    deadzoneYFraction,
    driftXPerFrame,
    driftYPerFrame,
    frames,
    minimumCorrectionPx,
    viewportHeight,
    viewportWidth,
}: {
    cooldownMs: number;
    deadzoneXFraction: number;
    deadzoneYFraction: number;
    driftXPerFrame: number;
    driftYPerFrame: number;
    frames: number;
    minimumCorrectionPx: number;
    viewportHeight: number;
    viewportWidth: number;
}) => {
    const point = { x: viewportWidth / 2, y: viewportHeight / 2 };
    let lastCommitAtMs = Number.NEGATIVE_INFINITY;
    const corrections: number[] = [];
    const commitFrameIndices: number[] = [];

    for (let frameIndex = 0; frameIndex < frames; frameIndex += 1) {
        point.x += driftXPerFrame;
        point.y += driftYPerFrame;

        const correction = resolveScreenSpaceFollowCorrection({
            deadzoneXFraction,
            deadzoneYFraction,
            minimumCorrectionPx,
            point,
            viewportHeight,
            viewportWidth,
        });

        const nowMs = frameIndex * 16.67;
        if (!correction.moved || nowMs - lastCommitAtMs < cooldownMs) {
            continue;
        }

        commitFrameIndices.push(frameIndex);
        corrections.push(correction.correctionMagnitudePx);
        point.x -= correction.cameraDeltaPx.x;
        point.y -= correction.cameraDeltaPx.y;
        lastCommitAtMs = nowMs;
    }

    return {
        commitFrameIndices,
        corrections,
        point,
    };
};

describe('player motion', () => {
    it('returns a neutral no-movement result when no input is pressed', () => {
        const positionMeters = { x: 250, z: -125 };
        const result = resolveMovementStep({
            delta: 1,
            moveX: 0,
            moveZ: 0,
            origin: level1.origin,
            positionMeters,
            scrambleMultiplier: 1,
            speed: 1_000,
        });

        expect(result.bearing).toBe(0);
        expect(result.distanceMeters).toBe(0);
        expect(result.nextPositionMeters).toEqual(positionMeters);
        expect(result.nextCoords).toEqual({
            lat: expect.any(Number),
            lng: expect.any(Number),
        });
    });

    it('moves east in meter-space without changing latitude', () => {
        const result = resolveMovementStep({
            delta: 1,
            moveX: 1,
            moveZ: 0,
            origin: level1.origin,
            positionMeters: { x: 0, z: 0 },
            scrambleMultiplier: 1,
            speed: 1_000,
        });

        expect(result.nextPositionMeters.x).toBeCloseTo(1_000, 5);
        expect(result.nextPositionMeters.z).toBeCloseTo(0, 5);
        expect(result.nextCoords.lat).toBeCloseTo(level1.origin.lat, 6);
        expect(result.nextCoords.lng).toBeGreaterThan(level1.origin.lng);
    });

    it('normalizes diagonal movement so it does not move faster than cardinal input', () => {
        const result = resolveMovementStep({
            delta: 1,
            moveX: 1,
            moveZ: 1,
            origin: level1.origin,
            positionMeters: { x: 0, z: 0 },
            scrambleMultiplier: 1,
            speed: 1_000,
        });

        expect(Math.hypot(result.nextPositionMeters.x, result.nextPositionMeters.z)).toBeCloseTo(1_000, 5);
    });

    it('moves west in meter-space without changing latitude', () => {
        const result = resolveMovementStep({
            delta: 1,
            moveX: -1,
            moveZ: 0,
            origin: level1.origin,
            positionMeters: { x: 0, z: 0 },
            scrambleMultiplier: 1,
            speed: 1_000,
        });

        expect(result.nextPositionMeters.x).toBeCloseTo(-1_000, 5);
        expect(result.nextPositionMeters.z).toBeCloseTo(0, 5);
        expect(result.nextCoords.lat).toBeCloseTo(level1.origin.lat, 6);
        expect(result.nextCoords.lng).toBeLessThan(level1.origin.lng);
    });

    it('moves north in meter-space without changing longitude', () => {
        const result = resolveMovementStep({
            delta: 1,
            moveX: 0,
            moveZ: 1,
            origin: level1.origin,
            positionMeters: { x: 0, z: 0 },
            scrambleMultiplier: 1,
            speed: 1_000,
        });

        expect(result.nextPositionMeters.x).toBeCloseTo(0, 5);
        expect(result.nextPositionMeters.z).toBeCloseTo(1_000, 5);
        expect(result.nextCoords.lng).toBeCloseTo(level1.origin.lng, 6);
        expect(result.nextCoords.lat).toBeGreaterThan(level1.origin.lat);
    });

    it('moves south in meter-space without changing longitude', () => {
        const result = resolveMovementStep({
            delta: 1,
            moveX: 0,
            moveZ: -1,
            origin: level1.origin,
            positionMeters: { x: 0, z: 0 },
            scrambleMultiplier: 1,
            speed: 1_000,
        });

        expect(result.nextPositionMeters.x).toBeCloseTo(0, 5);
        expect(result.nextPositionMeters.z).toBeCloseTo(-1_000, 5);
        expect(result.nextCoords.lng).toBeCloseTo(level1.origin.lng, 6);
        expect(result.nextCoords.lat).toBeLessThan(level1.origin.lat);
    });

    it('reverses horizontal bearing when movement is scrambled', () => {
        const normal = resolveMovementStep({
            delta: 1,
            moveX: 1,
            moveZ: 0,
            origin: level1.origin,
            positionMeters: { x: 0, z: 0 },
            scrambleMultiplier: 1,
            speed: 1_000,
        });
        const scrambled = resolveMovementStep({
            delta: 1,
            moveX: 1,
            moveZ: 0,
            origin: level1.origin,
            positionMeters: { x: 0, z: 0 },
            scrambleMultiplier: -1,
            speed: 1_000,
        });

        expect(normal.nextPositionMeters.x).toBeGreaterThan(0);
        expect(scrambled.nextPositionMeters.x).toBeLessThan(0);
    });

    it('keeps the camera still inside the deadzone', () => {
        const center = level1.origin;
        const follow = resolveCameraFollow({
            currentCenter: center,
            damping: 8,
            deadzoneMeters: 500,
            delta: 1 / 60,
            maxSpeedMetersPerSecond: 10_000,
            targetCoords: {
                lat: center.lat,
                lng: center.lng + 0.001,
            },
        });

        expect(follow.moved).toBe(false);
        expect(follow.nextCenter).toEqual(center);
    });

    it('caps camera follow speed so it cannot outrun the configured max follow rate', () => {
        const center = level1.origin;
        const target = {
            lat: center.lat,
            lng: center.lng + 0.5,
        };
        const delta = 1 / 60;
        const maxSpeedMetersPerSecond = 12_000;
        const follow = resolveCameraFollow({
            currentCenter: center,
            damping: 20,
            deadzoneMeters: 0,
            delta,
            maxSpeedMetersPerSecond,
            targetCoords: target,
        });
        const traveled = worldDistanceInMeters(follow.nextCenter, center);

        expect(follow.moved).toBe(true);
        expect(traveled).toBeLessThanOrEqual(maxSpeedMetersPerSecond * delta + 0.001);
        expect(traveled).toBeLessThan(worldDistanceInMeters(target, center));
    });

    it('moves the camera toward southern targets instead of away from them', () => {
        const center = level1.origin;
        const target = {
            lat: center.lat - 0.2,
            lng: center.lng,
        };
        const follow = resolveCameraFollow({
            currentCenter: center,
            damping: 10,
            deadzoneMeters: 0,
            delta: 1 / 60,
            maxSpeedMetersPerSecond: 12_000,
            targetCoords: target,
        });

        expect(follow.moved).toBe(true);
        expect(follow.nextCenter.lat).toBeLessThan(center.lat);
        expect(follow.nextCenter.lng).toBeCloseTo(center.lng, 6);
    });

    it('moves the camera toward eastern and western targets instead of away from them', () => {
        const center = level1.origin;
        const east = resolveCameraFollow({
            currentCenter: center,
            damping: 10,
            deadzoneMeters: 0,
            delta: 1 / 60,
            maxSpeedMetersPerSecond: 12_000,
            targetCoords: {
                lat: center.lat,
                lng: center.lng + 0.2,
            },
        });
        const west = resolveCameraFollow({
            currentCenter: center,
            damping: 10,
            deadzoneMeters: 0,
            delta: 1 / 60,
            maxSpeedMetersPerSecond: 12_000,
            targetCoords: {
                lat: center.lat,
                lng: center.lng - 0.2,
            },
        });

        expect(east.moved).toBe(true);
        expect(east.nextCenter.lng).toBeGreaterThan(center.lng);
        expect(east.nextCenter.lat).toBeCloseTo(center.lat, 6);

        expect(west.moved).toBe(true);
        expect(west.nextCenter.lng).toBeLessThan(center.lng);
        expect(west.nextCenter.lat).toBeCloseTo(center.lat, 6);
    });

    it('snaps immediately only when requested', () => {
        const center = level1.origin;
        const target = {
            lat: center.lat,
            lng: center.lng + 0.1,
        };
        const follow = resolveCameraFollow({
            currentCenter: center,
            damping: 8,
            deadzoneMeters: 0,
            delta: 1 / 60,
            immediate: true,
            maxSpeedMetersPerSecond: 1,
            targetCoords: target,
        });

        expect(follow.moved).toBe(true);
        expect(follow.nextCenter).toEqual(target);
    });

    it('keeps the camera fixed until the snap deadzone is exceeded', () => {
        const center = level1.origin;
        const nearbyTarget = {
            lat: center.lat,
            lng: center.lng + 0.01,
        };
        const distantTarget = {
            lat: center.lat,
            lng: center.lng + 0.2,
        };

        const still = resolveCameraSnapFollow({
            currentCenter: center,
            deadzoneMeters: 12_000,
            targetCoords: nearbyTarget,
        });
        const snapped = resolveCameraSnapFollow({
            currentCenter: center,
            deadzoneMeters: 12_000,
            targetCoords: distantTarget,
        });

        expect(still.moved).toBe(false);
        expect(still.nextCenter).toEqual(center);

        expect(snapped.moved).toBe(true);
        expect(snapped.nextCenter).toEqual(distantTarget);
        expect(snapped.appliedStepMeters).toBeCloseTo(worldDistanceInMeters(distantTarget, center), 3);
    });

    it('suppresses auto-follow during the manual camera interaction cooldown', () => {
        expect(
            shouldAutoFollowCamera({
                cooldownMs: 900,
                lastManualInteractionAt: 1_000,
                now: 1_500,
            }),
        ).toBe(false);

        expect(
            shouldAutoFollowCamera({
                cooldownMs: 900,
                lastManualInteractionAt: 1_000,
                now: 1_901,
            }),
        ).toBe(true);
    });

    it('keeps screen-space follow still when the player remains inside the safe zone', () => {
        const correction = resolveScreenSpaceFollowCorrection({
            deadzoneXFraction: 0.38,
            deadzoneYFraction: 0.28,
            point: { x: 640, y: 360 },
            viewportHeight: 720,
            viewportWidth: 1_280,
        });

        expect(correction.moved).toBe(false);
        expect(correction.cameraDeltaPx).toEqual({ x: 0, y: 0 });
        expect(correction.targetPoint).toEqual({ x: 640, y: 360 });
    });

    it('corrects only the overflow beyond the screen-space deadzone instead of recentering fully', () => {
        const correction = resolveScreenSpaceFollowCorrection({
            deadzoneXFraction: 0.25,
            deadzoneYFraction: 0.2,
            point: { x: 1_040, y: 560 },
            viewportHeight: 720,
            viewportWidth: 1_280,
        });

        expect(correction.moved).toBe(true);
        expect(correction.targetPoint).toEqual({ x: 960, y: 504 });
        expect(correction.cameraDeltaPx).toEqual({ x: 80, y: 56 });
        expect(correction.correctionMagnitudePx).toBeCloseTo(Math.hypot(80, 56), 5);
    });

    it('ignores tiny screen-space overflows below the correction threshold', () => {
        const correction = resolveScreenSpaceFollowCorrection({
            deadzoneXFraction: 0.25,
            deadzoneYFraction: 0.2,
            minimumCorrectionPx: 12,
            point: { x: 965, y: 508 },
            viewportHeight: 720,
            viewportWidth: 1_280,
        });

        expect(correction.correctionMagnitudePx).toBeCloseTo(Math.hypot(5, 4), 5);
        expect(correction.moved).toBe(false);
        expect(correction.cameraDeltaPx).toEqual({ x: 0, y: 0 });
        expect(correction.targetPoint).toEqual({ x: 965, y: 508 });
    });

    it('keeps steady vertical auto-follow corrections bounded under realistic drift', () => {
        const trace = simulateScreenSpaceFollowTrace({
            cooldownMs: 280,
            deadzoneXFraction: 0.38,
            deadzoneYFraction: 0.28,
            driftXPerFrame: 0,
            driftYPerFrame: 2.5,
            frames: 180,
            minimumCorrectionPx: 12,
            viewportHeight: 720,
            viewportWidth: 1_280,
        });

        expect(trace.corrections.length).toBeGreaterThan(0);
        expect(Math.max(...trace.corrections)).toBeLessThan(60);
        expect(Math.min(...trace.corrections)).toBeGreaterThanOrEqual(12);
        expect(
            trace.commitFrameIndices.every(
                (frame, index) => index === 0 || frame - trace.commitFrameIndices[index - 1]! >= 16,
            ),
        ).toBe(true);
    });

    it('keeps diagonal auto-follow corrections bounded under realistic drift', () => {
        const trace = simulateScreenSpaceFollowTrace({
            cooldownMs: 280,
            deadzoneXFraction: 0.38,
            deadzoneYFraction: 0.28,
            driftXPerFrame: 1.8,
            driftYPerFrame: 1.8,
            frames: 180,
            minimumCorrectionPx: 12,
            viewportHeight: 720,
            viewportWidth: 1_280,
        });

        expect(trace.corrections.length).toBeGreaterThan(0);
        expect(Math.max(...trace.corrections)).toBeLessThan(70);
        expect(Math.min(...trace.corrections)).toBeGreaterThanOrEqual(12);
        expect(
            trace.commitFrameIndices.every(
                (frame, index) => index === 0 || frame - trace.commitFrameIndices[index - 1]! >= 16,
            ),
        ).toBe(true);
        expect(Math.abs(trace.point.x - 640)).toBeLessThan(360);
        expect(Math.abs(trace.point.y - 360)).toBeLessThan(260);
    });
});
