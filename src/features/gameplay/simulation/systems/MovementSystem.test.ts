import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { level1 } from '@/content/levels/level-1/config';
import type { SimulationState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { applyMovementStep } from '@/features/gameplay/simulation/systems/MovementSystem';
import * as movementUtils from '@/features/gameplay/simulation/systems/movement-utils';
import { BASE_PLAYER_SPEED_METERS_PER_SECOND } from '@/shared/constants/gameplay';
import { metersOffsetFromCoords } from '@/shared/geo';

const createSimulationState = (): SimulationState => ({
    character: {
        obstacleDamageMultiplier: CHARACTER_CONFIGS.bukhari.obstacleDamageMultiplier,
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
        lastHitAt: 0,
        positionMeters: metersOffsetFromCoords(level1.origin, level1.origin),
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

        const result = applyMovementStep(state, { moveX: 1, moveZ: 0 }, 16.67);

        expect(result.events).toEqual([]);
        expect(result.player).toEqual({
            ...state.player,
            speed: 0,
        });
    });

    it('stops the player when there is no movement input', () => {
        const state = createSimulationState();

        const result = applyMovementStep(state, { moveX: 0, moveZ: 0 }, 16.67);

        expect(result.events).toEqual([]);
        expect(result.player).toEqual({
            ...state.player,
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

        const result = applyMovementStep(state, { moveX: 1, moveZ: 0 }, 50);

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
            positionMeters: { x: 10, z: 0 },
            speed: BASE_PLAYER_SPEED_METERS_PER_SECOND * state.character.speedMultiplier,
        });
    });
});
