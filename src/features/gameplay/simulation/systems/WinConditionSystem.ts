import type {
    SimulationEvent,
    SimulationLevelState,
    SimulationState,
} from '@/features/gameplay/simulation/core/SimulationTypes';
import { meetsWinCondition } from '@/features/gameplay/simulation/systems/CollisionSystem';

export const applyWinConditionSystem = (
    state: SimulationState,
    levelState: SimulationLevelState,
): { events: SimulationEvent[]; levelState: SimulationLevelState } => {
    const isComplete = meetsWinCondition(
        state.level,
        levelState.completedTeacherIds,
        levelState.completedMilestoneIds,
        levelState.lockedHadith,
        state.player.hadithTokens,
    );

    if (!isComplete || levelState.isComplete) {
        return { events: [], levelState };
    }

    return {
        events: [{ cue: 'level-complete', type: 'audio' }, { type: 'chapter-complete' }],
        levelState: {
            ...levelState,
            isComplete: true,
        },
    };
};
