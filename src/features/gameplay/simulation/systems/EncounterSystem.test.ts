import { describe, expect, it } from 'vitest';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { level1 } from '@/content/levels/level-1/config';
import type { SimulationState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { applyEncounterSystems } from '@/features/gameplay/simulation/systems/EncounterSystem';
import { metersOffsetFromCoords } from '@/shared/geo';

const createSimulationState = (overrides?: Partial<SimulationState>): SimulationState => ({
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
        ...overrides?.levelState,
    },
    nowMs: 10_000,
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
        speed: 0,
        tokensLost: 0,
        ...overrides?.player,
    },
    ...overrides,
});

describe('EncounterSystem', () => {
    it('does not apply obstacle token loss when no obstacle is nearby', () => {
        const state = createSimulationState({
            player: {
                ...createSimulationState().player,
                coords: level1.origin,
                hadithTokens: 4,
            },
        });

        const result = applyEncounterSystems(state);

        expect(result.events.some((event) => event.type === 'player-hit')).toBe(false);
        expect(result.player.hadithTokens).toBe(4);
        expect(result.player.tokensLost).toBe(0);
    });

    it('caps obstacle token loss to the number of tokens the player has', () => {
        const obstacle = level1.obstacles[0];
        if (!obstacle) {
            throw new Error('Level 1 must include at least one obstacle for this test.');
        }

        const baseState = createSimulationState();
        const result = applyEncounterSystems({
            ...baseState,
            character: {
                ...baseState.character,
                obstacleDamageMultiplier: 5,
            },
            player: {
                ...baseState.player,
                coords: obstacle.coords,
                hadithTokens: 1,
                positionMeters: metersOffsetFromCoords(obstacle.coords, level1.origin),
            },
        });

        expect(result.events).toContainEqual({ lostCount: 1, type: 'player-hit' });
        expect(result.player.hadithTokens).toBe(0);
        expect(result.player.tokensLost).toBe(1);
        expect(result.levelState.tokens).toHaveLength(1);
    });
});
