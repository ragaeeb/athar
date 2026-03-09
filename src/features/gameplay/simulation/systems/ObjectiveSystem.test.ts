import { describe, expect, it } from 'vitest';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { level1 } from '@/content/levels/level-1/config';
import type { SimulationState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { applyObjectiveSystem } from '@/features/gameplay/simulation/systems/ObjectiveSystem';
import { metersOffsetFromCoords } from '@/shared/geo';

const createSimulationState = (overrides?: Partial<SimulationState>): SimulationState => ({
    character: {
        obstacleDamageMultiplier: CHARACTER_CONFIGS.bukhari.obstacleDamageMultiplier,
        speedMultiplier: CHARACTER_CONFIGS.bukhari.speedMultiplier,
        tokenRadiusMultiplier: CHARACTER_CONFIGS.bukhari.tokenRadiusMultiplier,
    },
    level: level1,
    levelState: {
        completedMilestoneIds: [level1.milestones[0]?.id].filter(Boolean) as string[],
        completedTeacherIds: [],
        isComplete: false,
        lockedHadith: 0,
        nextObjective: null,
        objectives: [],
        tokens: [],
        ...overrides?.levelState,
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
        speed: 0,
        tokensLost: 0,
        ...overrides?.player,
    },
});

describe('ObjectiveSystem', () => {
    it('counts carried hadith toward the verify objective so the HUD matches the win condition', () => {
        const baseState = createSimulationState();
        const state = createSimulationState({
            levelState: {
                completedMilestoneIds: [level1.milestones[0]?.id].filter(Boolean) as string[],
                completedTeacherIds: ['makki-ibn-ibrahim'],
                isComplete: false,
                lockedHadith: 13,
                nextObjective: null,
                objectives: [],
                tokens: [],
            },
            player: {
                ...baseState.player,
                hadithTokens: 22,
            },
        });

        const result = applyObjectiveSystem(state, state.levelState);
        const hadithObjective = result.levelState.objectives.find((objective) => objective.kind === 'hadith');

        expect(hadithObjective).toMatchObject({
            completed: true,
            detail: '35/30 gathered',
            label: 'Verify 30 hadith',
        });
    });

    it('marks the final milestone objective complete once the sanctuary is reached', () => {
        const completedMilestoneIds = [level1.milestones[0]?.id, level1.winCondition.finalMilestone].filter(
            Boolean,
        ) as string[];
        const state = createSimulationState({
            levelState: {
                completedMilestoneIds,
                completedTeacherIds: ['makki-ibn-ibrahim'],
                isComplete: false,
                lockedHadith: 30,
                nextObjective: null,
                objectives: [],
                tokens: [],
            },
        });

        const result = applyObjectiveSystem(state, state.levelState);
        const finalMilestoneObjective = result.levelState.objectives.find(
            (objective) => objective.kind === 'milestone',
        );

        expect(finalMilestoneObjective).toMatchObject({
            completed: true,
            id: level1.winCondition.finalMilestone,
            label: 'Makkah Sanctuary',
        });
    });
});
