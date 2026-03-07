import type {
    SimulationEvent,
    SimulationLevelState,
    SimulationState,
} from '@/features/gameplay/simulation/core/SimulationTypes';
import { resolveNextObjective } from '@/features/gameplay/systems/CollisionSystem';

const buildObjectives = (state: SimulationState, levelState: SimulationLevelState) => [
    {
        completed: levelState.lockedHadith >= state.level.winCondition.requiredHadith,
        detail: `${levelState.lockedHadith}/${state.level.winCondition.requiredHadith} preserved`,
        id: `${state.level.id}-hadith`,
        kind: 'hadith' as const,
        label: `Verify ${state.level.winCondition.requiredHadith} hadith`,
    },
    ...state.level.winCondition.requiredTeachers.map((teacherId) => {
        const teacher = state.level.teachers.find((entry) => entry.id === teacherId);
        return {
            completed: levelState.completedTeacherIds.includes(teacherId),
            detail: teacher ? `Meet ${teacher.name} in ${teacher.city}` : 'Teacher encounter',
            id: teacherId,
            kind: 'teacher' as const,
            label: teacher?.name ?? teacherId,
        };
    }),
    {
        completed: levelState.completedMilestoneIds.includes(state.level.winCondition.finalMilestone),
        detail: 'Reach the final milestone to complete the leg.',
        id: state.level.winCondition.finalMilestone,
        kind: 'milestone' as const,
        label:
            state.level.milestones.find((milestone) => milestone.id === state.level.winCondition.finalMilestone)
                ?.label ?? 'Final milestone',
    },
];

const objectivesMatch = (left: SimulationLevelState['nextObjective'], right: SimulationLevelState['nextObjective']) => {
    if (left === right) {
        return true;
    }

    if (!left || !right) {
        return left === right;
    }

    if (left.id !== right.id) {
        return false;
    }

    if ('density' in left && 'density' in right) {
        return left.density === right.density;
    }

    if ('buildingType' in left || 'buildingType' in right) {
        return 'buildingType' in left && 'buildingType' in right;
    }

    if ('hadith' in left || 'hadith' in right) {
        return 'hadith' in left && 'hadith' in right;
    }

    return true;
};

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
    const objectives = buildObjectives(state, levelState);

    return {
        events: objectivesMatch(levelState.nextObjective, nextObjective)
            ? []
            : [{ objective: nextObjective, type: 'objective-updated' }],
        levelState:
            objectivesMatch(levelState.nextObjective, nextObjective) &&
            JSON.stringify(levelState.objectives) === JSON.stringify(objectives)
                ? levelState
                : {
                      ...levelState,
                      nextObjective,
                      objectives,
                  },
    };
};
