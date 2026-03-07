import type {
    SimulationAdvanceInput,
    SimulationAdvanceResult,
    SimulationEvent,
    SimulationStepInput,
    SimulationStepResult,
} from '@/features/gameplay/simulation/core/SimulationTypes';
import { applyEncounterSystems } from '@/features/gameplay/simulation/systems/EncounterSystem';
import { applyMovementStep } from '@/features/gameplay/simulation/systems/MovementSystem';
import { applyObjectiveSystem } from '@/features/gameplay/simulation/systems/ObjectiveSystem';
import { applyWinConditionSystem } from '@/features/gameplay/simulation/systems/WinConditionSystem';

export const DEFAULT_FIXED_TIMESTEP_MS = 1_000 / 60;
export const DEFAULT_MAX_CATCH_UP_STEPS = 5;
export const DEFAULT_MAX_FRAME_DELTA_MS = DEFAULT_FIXED_TIMESTEP_MS * DEFAULT_MAX_CATCH_UP_STEPS;

type SimulationRunnerOptions = {
    fixedTimestepMs?: number;
    maxCatchUpSteps?: number;
    maxFrameDeltaMs?: number;
};

export type SimulationRunner = {
    advance: (input: SimulationAdvanceInput) => SimulationAdvanceResult;
    reset: (nowMs?: number) => void;
};

const clampFrameDeltaMs = (frameDeltaMs: number, maxFrameDeltaMs: number) => {
    if (!Number.isFinite(frameDeltaMs) || frameDeltaMs <= 0) {
        return 0;
    }

    return Math.min(frameDeltaMs, maxFrameDeltaMs);
};

export const stepSimulation = ({ deltaMs, input, state }: SimulationStepInput): SimulationStepResult => {
    const events: SimulationEvent[] = [];
    let nextState = {
        ...state,
        nowMs: state.nowMs + deltaMs,
    };

    const movement = applyMovementStep(nextState, input, deltaMs);
    nextState = {
        ...nextState,
        player: movement.player,
    };
    events.push(...movement.events);

    const encounters = applyEncounterSystems(nextState);
    nextState = {
        ...nextState,
        levelState: encounters.levelState,
        player: encounters.player,
    };
    events.push(...encounters.events);

    const objectives = applyObjectiveSystem(nextState, nextState.levelState);
    nextState = {
        ...nextState,
        levelState: objectives.levelState,
    };
    events.push(...objectives.events);

    const winCondition = applyWinConditionSystem(nextState, nextState.levelState);
    nextState = {
        ...nextState,
        levelState: winCondition.levelState,
    };
    events.push(...winCondition.events);

    return {
        events,
        state: nextState,
    };
};

export const createSimulationRunner = ({
    fixedTimestepMs = DEFAULT_FIXED_TIMESTEP_MS,
    maxCatchUpSteps = DEFAULT_MAX_CATCH_UP_STEPS,
    maxFrameDeltaMs = DEFAULT_MAX_FRAME_DELTA_MS,
}: SimulationRunnerOptions = {}): SimulationRunner => {
    let accumulatorMs = 0;
    let simulatedNowMs: number | null = null;

    return {
        advance: ({ frameDeltaMs, input, state }) => {
            accumulatorMs += clampFrameDeltaMs(frameDeltaMs, maxFrameDeltaMs);

            let nextState = simulatedNowMs === null ? state : { ...state, nowMs: simulatedNowMs };
            const events: SimulationEvent[] = [];
            let didStep = false;
            let steps = 0;

            while (accumulatorMs >= fixedTimestepMs && steps < maxCatchUpSteps) {
                const result = stepSimulation({
                    deltaMs: fixedTimestepMs,
                    input,
                    state: nextState,
                });

                nextState = result.state;
                simulatedNowMs = nextState.nowMs;
                accumulatorMs -= fixedTimestepMs;
                steps += 1;
                didStep = true;
                events.push(...result.events);
            }

            if (steps === maxCatchUpSteps && accumulatorMs >= fixedTimestepMs) {
                accumulatorMs = Math.min(accumulatorMs, fixedTimestepMs);
            }

            return {
                didStep,
                events,
                state: nextState,
            };
        },
        reset: (nowMs = Date.now()) => {
            accumulatorMs = 0;
            simulatedNowMs = nowMs;
        },
    };
};
