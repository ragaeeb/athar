import { describe, expect, it } from 'vitest';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { level1 } from '@/content/levels/level-1/config';
import {
    createSimulationRunner,
    DEFAULT_FIXED_TIMESTEP_MS,
    stepSimulation,
} from '@/features/gameplay/simulation/core/SimulationRunner';
import type { SimulationState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { generateClusterTokens, metersOffsetFromCoords } from '@/shared/geo';

const createSimulationState = ({
    coords = level1.origin,
    nowMs = 1_000,
    tokens = generateClusterTokens(level1.hadithTokenClusters),
}: {
    coords?: { lat: number; lng: number };
    nowMs?: number;
    tokens?: ReturnType<typeof generateClusterTokens>;
} = {}): SimulationState => ({
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
        tokens,
    },
    nowMs,
    player: {
        activeTeacher: null,
        bearing: 0,
        coords,
        dialogueOpen: false,
        hadithTokens: 0,
        hitTokens: [],
        isHit: false,
        lastHitAt: 0,
        positionMeters: metersOffsetFromCoords(coords, level1.origin),
        scrambleUntil: 0,
        speed: 0,
        tokensLost: 0,
    },
});

describe('SimulationRunner', () => {
    it('steps deterministic gameplay without React or canvas and collects nearby tokens', () => {
        const initialState = createSimulationState();

        const result = stepSimulation({
            deltaMs: DEFAULT_FIXED_TIMESTEP_MS,
            input: {
                moveX: 0,
                moveZ: 0,
            },
            state: initialState,
        });

        const collectedEvents = result.events.filter((event) => event.type === 'token-collected');
        const collectedCount = level1.hadithTokenClusters[0]?.count ?? 0;

        expect(collectedEvents).toHaveLength(collectedCount);
        expect(result.state.player.hadithTokens).toBe(collectedCount);
        expect(result.state.levelState.tokens.filter((token) => token.collected)).toHaveLength(collectedCount);
    });

    it('advances on a fixed timestep accumulator and retains fractional frame remainder', () => {
        const runner = createSimulationRunner();
        const initialState = createSimulationState({ tokens: [] });

        const result = runner.advance({
            frameDeltaMs: DEFAULT_FIXED_TIMESTEP_MS * 2.5,
            input: {
                moveX: 1,
                moveZ: 0,
            },
            state: initialState,
        });

        expect(result.didStep).toBe(true);
        expect(result.state.nowMs).toBeCloseTo(initialState.nowMs + DEFAULT_FIXED_TIMESTEP_MS * 2, 5);
        expect(result.state.player.positionMeters.x).toBeGreaterThan(0);
        expect(result.state.player.positionMeters.z).toBeCloseTo(0, 5);
    });
});
