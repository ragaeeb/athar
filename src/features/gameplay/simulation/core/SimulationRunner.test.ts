import { describe, expect, it } from 'vitest';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { level1 } from '@/content/levels/level-1/config';
import {
    createSimulationRunner,
    DEFAULT_FIXED_TIMESTEP_MS,
    DEFAULT_MAX_CATCH_UP_STEPS,
    stepSimulation,
} from '@/features/gameplay/simulation/core/SimulationRunner';
import type { SimulationState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { PLAYER_RUN_MAX_CHARGE_MS } from '@/shared/constants/gameplay';
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
        guardLossMultiplier: CHARACTER_CONFIGS.bukhari.guardLossMultiplier,
        obstacleDamageMultiplier: CHARACTER_CONFIGS.bukhari.obstacleDamageMultiplier,
        rivalLossMultiplier: CHARACTER_CONFIGS.bukhari.rivalLossMultiplier,
        scrambleDurationMultiplier: CHARACTER_CONFIGS.bukhari.scrambleDurationMultiplier,
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
        isRunning: false,
        lastHitAt: 0,
        positionMeters: metersOffsetFromCoords(coords, level1.origin),
        runChargeMs: PLAYER_RUN_MAX_CHARGE_MS,
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
                runRequested: false,
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
                runRequested: false,
            },
            state: initialState,
        });

        expect(result.didStep).toBe(true);
        expect(result.accumulatorMs).toBeCloseTo(DEFAULT_FIXED_TIMESTEP_MS * 0.5, 5);
        expect(result.state.nowMs).toBeCloseTo(initialState.nowMs + DEFAULT_FIXED_TIMESTEP_MS * 2, 5);
        expect(result.state.player.positionMeters.x).toBeGreaterThan(0);
        expect(result.state.player.positionMeters.z).toBeCloseTo(0, 5);

        const flushedRemainder = runner.advance({
            frameDeltaMs: DEFAULT_FIXED_TIMESTEP_MS * 0.5,
            input: {
                moveX: 1,
                moveZ: 0,
                runRequested: false,
            },
            state: result.state,
        });

        expect(flushedRemainder.didStep).toBe(true);
        expect(flushedRemainder.accumulatorMs).toBeCloseTo(0, 5);
        expect(flushedRemainder.state.nowMs).toBeCloseTo(initialState.nowMs + DEFAULT_FIXED_TIMESTEP_MS * 3, 5);
        expect(flushedRemainder.state.player.positionMeters.x).toBeGreaterThan(result.state.player.positionMeters.x);
    });

    it('fixed-timestep: produces the same authoritative result for equivalent elapsed time split across frames', () => {
        const initialState = createSimulationState({ tokens: [] });
        const movementInput = { moveX: 1, moveZ: 0, runRequested: false } as const;
        const fixedTimestepMs = 10;

        const chunkedRunner = createSimulationRunner({
            fixedTimestepMs,
            maxFrameDeltaMs: fixedTimestepMs * 10,
        });
        let chunkedState = initialState;
        for (const frameDeltaMs of [fixedTimestepMs * 2, fixedTimestepMs * 3]) {
            const result = chunkedRunner.advance({
                frameDeltaMs,
                input: movementInput,
                state: chunkedState,
            });
            chunkedState = result.state;
        }

        const steadyRunner = createSimulationRunner({
            fixedTimestepMs,
            maxFrameDeltaMs: fixedTimestepMs * 10,
        });
        let steadyState = initialState;
        for (let index = 0; index < 5; index += 1) {
            const result = steadyRunner.advance({
                frameDeltaMs: fixedTimestepMs,
                input: movementInput,
                state: steadyState,
            });
            steadyState = result.state;
        }

        expect(chunkedState.nowMs).toBeCloseTo(steadyState.nowMs, 5);
        expect(chunkedState.player.positionMeters.x).toBeCloseTo(steadyState.player.positionMeters.x, 5);
        expect(chunkedState.player.positionMeters.z).toBeCloseTo(steadyState.player.positionMeters.z, 5);
    });

    it('variable-timestep: steps once per advance with raw frameDelta', () => {
        const runner = createSimulationRunner({ variableTimestep: true });
        const initialState = createSimulationState({ tokens: [] });

        const result = runner.advance({
            frameDeltaMs: 16.5,
            input: { moveX: 1, moveZ: 0, runRequested: false },
            state: initialState,
        });

        expect(result.didStep).toBe(true);
        expect(result.accumulatorMs).toBe(0);
        expect(result.state.nowMs).toBeCloseTo(initialState.nowMs + 16.5, 5);
        expect(result.state.player.positionMeters.x).toBeGreaterThan(0);

        const secondResult = runner.advance({
            frameDeltaMs: 14.2,
            input: { moveX: 1, moveZ: 0, runRequested: false },
            state: result.state,
        });

        expect(secondResult.didStep).toBe(true);
        expect(secondResult.accumulatorMs).toBe(0);
        expect(secondResult.state.nowMs).toBeCloseTo(initialState.nowMs + 16.5 + 14.2, 5);
        expect(secondResult.state.player.positionMeters.x).toBeGreaterThan(result.state.player.positionMeters.x);
    });

    it('variable-timestep: clamps large frame deltas', () => {
        const runner = createSimulationRunner({ variableTimestep: true });
        const initialState = createSimulationState({ tokens: [] });

        const result = runner.advance({
            frameDeltaMs: 500,
            input: { moveX: 1, moveZ: 0, runRequested: false },
            state: initialState,
        });

        expect(result.didStep).toBe(true);
        expect(result.state.nowMs).toBeCloseTo(
            initialState.nowMs + DEFAULT_FIXED_TIMESTEP_MS * DEFAULT_MAX_CATCH_UP_STEPS,
            5,
        );
    });

    it('variable-timestep: returns didStep false for zero/negative delta', () => {
        const runner = createSimulationRunner({ variableTimestep: true });
        const initialState = createSimulationState({ tokens: [] });

        const result = runner.advance({
            frameDeltaMs: 0,
            input: { moveX: 1, moveZ: 0, runRequested: false },
            state: initialState,
        });

        expect(result.didStep).toBe(false);
    });
});
