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
    variableTimestep?: boolean;
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
    events.push.apply(events, movement.events);

    const encounters = applyEncounterSystems(nextState);
    nextState = {
        ...nextState,
        levelState: encounters.levelState,
        player: encounters.player,
    };
    events.push.apply(events, encounters.events);

    const objectives = applyObjectiveSystem(nextState, nextState.levelState);
    nextState = {
        ...nextState,
        levelState: objectives.levelState,
    };
    events.push.apply(events, objectives.events);

    const winCondition = applyWinConditionSystem(nextState, nextState.levelState);
    nextState = {
        ...nextState,
        levelState: winCondition.levelState,
    };
    events.push.apply(events, winCondition.events);

    return {
        events,
        state: nextState,
    };
};

export const createSimulationRunner = ({
    fixedTimestepMs = DEFAULT_FIXED_TIMESTEP_MS,
    maxCatchUpSteps = DEFAULT_MAX_CATCH_UP_STEPS,
    maxFrameDeltaMs = DEFAULT_MAX_FRAME_DELTA_MS,
    variableTimestep = false,
}: SimulationRunnerOptions = {}): SimulationRunner => {
    let accumulatorMs = 0;
    let simulatedNowMs: number | null = null;

    const advanceVariable = ({ frameDeltaMs, input, state }: SimulationAdvanceInput): SimulationAdvanceResult => {
        const clampedDelta = clampFrameDeltaMs(frameDeltaMs, maxFrameDeltaMs);
        if (clampedDelta <= 0) {
            return { accumulatorMs: 0, didStep: false, events: [], state };
        }

        const nextState = simulatedNowMs === null ? state : { ...state, nowMs: simulatedNowMs };
        const result = stepSimulation({ deltaMs: clampedDelta, input, state: nextState });
        simulatedNowMs = result.state.nowMs;

        return {
            accumulatorMs: 0,
            didStep: true,
            events: result.events,
            state: result.state,
        };
    };

    const advanceFixed = ({ frameDeltaMs, input, state }: SimulationAdvanceInput): SimulationAdvanceResult => {
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
            accumulatorMs,
            didStep,
            events,
            state: nextState,
        };
    };

    return {
        advance: variableTimestep ? advanceVariable : advanceFixed,
        reset: (nowMs = Date.now()) => {
            accumulatorMs = 0;
            simulatedNowMs = nowMs;
        },
    };
};
