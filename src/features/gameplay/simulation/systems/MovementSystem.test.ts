import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { level1 } from '@/content/levels/level-1/config';
import type { SimulationState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { applyMovementStep } from '@/features/gameplay/simulation/systems/MovementSystem';
import * as movementUtils from '@/features/gameplay/simulation/systems/movement-utils';
import {
    BASE_PLAYER_SPEED_METERS_PER_SECOND,
    PLAYER_RUN_MAX_CHARGE_MS,
    PLAYER_RUN_SPEED_MULTIPLIER,
} from '@/shared/constants/gameplay';
import { metersOffsetFromCoords } from '@/shared/geo';

const createSimulationState = (): SimulationState => ({
    character: {
        guardLossMultiplier: CHARACTER_CONFIGS.bukhari.guardLossMultiplier,
        obstacleDamageMultiplier: CHARACTER_CONFIGS.bukhari.obstacleDamageMultiplier,
        rivalLossMultiplier: CHARACTER_CONFIGS.bukhari.rivalLossMultiplier,
        scrambleDurationMultiplier: CHARACTER_CONFIGS.bukhari.scrambleDurationMultiplier,
        speedMultiplier: CHARACTER_CONFIGS.bukhari.speedMultiplier,
        tokenRadiusMultiplier: CHARACTER_CONFIGS.bukhari.tokenRadiusMultiplier,
    },
    level: level1,
    levelState: {
        completedMilestoneIds: [],
        completedTeacherIds: [],
        isComplete: false,
        lockedHadith: 0,
        nextObjective: null,
        objectives: [],
        tokens: [],
    },
    nowMs: 1_000,
    player: {
        activeTeacher: null,
        bearing: 0,
        coords: level1.origin,
        dialogueOpen: false,
        hadithTokens: 0,
        hitTokens: [],
        isHit: false,
        isRunning: false,
        lastHitAt: 0,
        positionMeters: metersOffsetFromCoords(level1.origin, level1.origin),
        runChargeMs: PLAYER_RUN_MAX_CHARGE_MS,
        scrambleUntil: 0,
        speed: 250,
        tokensLost: 0,
    },
});

describe('MovementSystem', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('stops the player when the level is already complete', () => {
        const state = createSimulationState();
        state.levelState.isComplete = true;

        const result = applyMovementStep(state, { moveX: 1, moveZ: 0, runRequested: false }, 16.67);

        expect(result.events).toEqual([]);
        expect(result.player).toEqual({
            ...state.player,
            isRunning: false,
            speed: 0,
        });
    });

    it('stops the player when there is no movement input', () => {
        const state = createSimulationState();

        const result = applyMovementStep(state, { moveX: 0, moveZ: 0, runRequested: false }, 16.67);

        expect(result.events).toEqual([]);
        expect(result.player).toEqual({
            ...state.player,
            isRunning: false,
            speed: 0,
        });
    });

    it('applies a movement step with the converted delta and speed multiplier', () => {
        const state = createSimulationState();
        const resolveMovementStepSpy = vi.spyOn(movementUtils, 'resolveMovementStep').mockReturnValue({
            bearing: Math.PI / 2,
            distanceMeters: 10,
            nextCoords: { lat: 39.78, lng: 64.44 },
            nextPositionMeters: { x: 10, z: 0 },
        });

        const result = applyMovementStep(state, { moveX: 1, moveZ: 0, runRequested: false }, 50);

        expect(resolveMovementStepSpy).toHaveBeenCalledTimes(1);
        expect(resolveMovementStepSpy).toHaveBeenCalledWith({
            delta: 0.05,
            moveX: 1,
            moveZ: 0,
            origin: state.level.origin,
            positionMeters: state.player.positionMeters,
            scrambleMultiplier: 1,
            speed: BASE_PLAYER_SPEED_METERS_PER_SECOND * state.character.speedMultiplier,
        });
        expect(result.events).toEqual([{ type: 'player-moved' }]);
        expect(result.player).toEqual({
            ...state.player,
            bearing: Math.PI / 2,
            coords: { lat: 39.78, lng: 64.44 },
            isRunning: false,
            positionMeters: { x: 10, z: 0 },
            speed: BASE_PLAYER_SPEED_METERS_PER_SECOND * state.character.speedMultiplier,
        });
    });

    it('boosts movement speed and drains run charge while shift is held', () => {
        const state = createSimulationState();
        const resolveMovementStepSpy = vi.spyOn(movementUtils, 'resolveMovementStep').mockReturnValue({
            bearing: Math.PI / 2,
            distanceMeters: 10,
            nextCoords: { lat: 39.78, lng: 64.44 },
            nextPositionMeters: { x: 10, z: 0 },
        });

        const result = applyMovementStep(state, { moveX: 1, moveZ: 0, runRequested: true }, 100);

        expect(resolveMovementStepSpy).toHaveBeenCalledWith({
            delta: 0.1,
            moveX: 1,
            moveZ: 0,
            origin: state.level.origin,
            positionMeters: state.player.positionMeters,
            scrambleMultiplier: 1,
            speed: BASE_PLAYER_SPEED_METERS_PER_SECOND * state.character.speedMultiplier * PLAYER_RUN_SPEED_MULTIPLIER,
        });
        expect(result.player.isRunning).toBe(true);
        expect(result.player.runChargeMs).toBe(PLAYER_RUN_MAX_CHARGE_MS - 100);
    });

    it('recharges run charge while walking normally or standing still', () => {
        const state = createSimulationState();
        state.player.runChargeMs = 500;

        const walkingResult = applyMovementStep(state, { moveX: 1, moveZ: 0, runRequested: false }, 450);
        expect(walkingResult.player.runChargeMs).toBeGreaterThan(500);
        expect(walkingResult.player.isRunning).toBe(false);

        const idleResult = applyMovementStep(
            { ...state, player: { ...state.player, runChargeMs: 500 } },
            { moveX: 0, moveZ: 0, runRequested: false },
            450,
        );
        expect(idleResult.player.runChargeMs).toBeGreaterThan(500);
    });

    it('requires a minimum charge before re-engaging a run after exhaustion', () => {
        const state = createSimulationState();
        state.player.runChargeMs = Math.max(1, PLAYER_RUN_MAX_CHARGE_MS * 0.5);

        const result = applyMovementStep(state, { moveX: 1, moveZ: 0, runRequested: true }, 50);

        expect(result.player.isRunning).toBe(false);
        expect(result.player.speed).toBe(BASE_PLAYER_SPEED_METERS_PER_SECOND * state.character.speedMultiplier);
    });

    it('reverses horizontal movement while preserving forward movement while scramble is active', () => {
        const baselineState = createSimulationState();
        const scrambledState = createSimulationState();
        scrambledState.player.scrambleUntil = scrambledState.nowMs + 1_000;

        const baseline = applyMovementStep(baselineState, { moveX: 1, moveZ: 1, runRequested: false }, 50);
        const scrambled = applyMovementStep(scrambledState, { moveX: 1, moveZ: 1, runRequested: false }, 50);

        expect(baseline.player.positionMeters.x).toBeGreaterThan(0);
        expect(scrambled.player.positionMeters.x).toBeLessThan(0);
        expect(baseline.player.positionMeters.z).toBeGreaterThan(0);
        expect(scrambled.player.positionMeters.z).toBeGreaterThan(0);
        expect(Math.abs(scrambled.player.positionMeters.x)).toBeCloseTo(Math.abs(baseline.player.positionMeters.x), 6);
        expect(scrambled.player.positionMeters.z).toBeCloseTo(baseline.player.positionMeters.z, 6);
    });
});
