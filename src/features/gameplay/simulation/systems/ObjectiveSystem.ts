import type { ObjectiveStatus } from '@/content/levels/types';
import { nextObjectivesMatch } from '@/features/gameplay/objective-utils';
import { buildObjectiveStatuses, getChapterHadithTotal } from '@/features/gameplay/objectives';
import type {
    SimulationEvent,
    SimulationLevelState,
    SimulationState,
} from '@/features/gameplay/simulation/core/SimulationTypes';
import { resolveNextObjective } from '@/features/gameplay/simulation/systems/CollisionSystem';

const objectiveStatusesMatch = (left: ObjectiveStatus[], right: ObjectiveStatus[]) =>
    left.length === right.length &&
    left.every(
        (entry, index) =>
            entry.completed === right[index]?.completed &&
            entry.detail === right[index]?.detail &&
            entry.id === right[index]?.id,
    );

export const applyObjectiveSystem = (
    state: SimulationState,
    levelState: SimulationLevelState,
): { events: SimulationEvent[]; levelState: SimulationLevelState } => {
    const nextObjective = resolveNextObjective(
        state.level,
        levelState.completedTeacherIds,
        levelState.completedMilestoneIds,
        levelState.tokens,
    );
    const objectives = buildObjectiveStatuses(
        state.level,
        levelState.completedTeacherIds,
        levelState.completedMilestoneIds,
        getChapterHadithTotal(levelState.lockedHadith, state.player.hadithTokens),
    );

    const nextObjectiveMatch = nextObjectivesMatch(levelState.nextObjective, nextObjective);
    const statusesMatch = nextObjectiveMatch && objectiveStatusesMatch(levelState.objectives, objectives);

    return {
        events: nextObjectiveMatch ? [] : [{ objective: nextObjective, type: 'objective-updated' }],
        levelState:
            nextObjectiveMatch && statusesMatch
                ? levelState
                : {
                      ...levelState,
                      nextObjective,
                      objectives,
                  },
    };
};
