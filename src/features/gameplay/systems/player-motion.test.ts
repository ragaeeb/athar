import { describe, expect, it } from 'vitest';

import { level1 } from '@/content/levels/level-1/config';
import { worldDistanceInMeters } from '@/features/map/lib/geo';

import { resolveCameraFollow, resolveMovementStep, shouldAutoFollowCamera } from './player-motion';

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
});
