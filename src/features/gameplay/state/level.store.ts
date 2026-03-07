import { create } from 'zustand';
import type { LevelConfig, NextObjective, ObjectiveStatus, TokenState } from '@/content/levels/types';
import { generateClusterTokens } from '@/features/map/lib/geo';

const buildObjectives = (
    config: LevelConfig,
    completedTeacherIds: string[],
    completedMilestoneIds: string[],
    lockedHadith: number,
): ObjectiveStatus[] => [
    {
        completed: lockedHadith >= config.winCondition.requiredHadith,
        detail: `${lockedHadith}/${config.winCondition.requiredHadith} preserved`,
        id: `${config.id}-hadith`,
        kind: 'hadith',
        label: `Verify ${config.winCondition.requiredHadith} hadith`,
    },
    ...config.winCondition.requiredTeachers.map((teacherId) => {
        const teacher = config.teachers.find((entry) => entry.id === teacherId);
        return {
            completed: completedTeacherIds.includes(teacherId),
            detail: teacher ? `Meet ${teacher.name} in ${teacher.city}` : 'Teacher encounter',
            id: teacherId,
            kind: 'teacher' as const,
            label: teacher?.name ?? teacherId,
        };
    }),
    {
        completed: completedMilestoneIds.includes(config.winCondition.finalMilestone),
        detail: 'Reach the final milestone to complete the leg.',
        id: config.winCondition.finalMilestone,
        kind: 'milestone',
        label:
            config.milestones.find((milestone) => milestone.id === config.winCondition.finalMilestone)?.label ??
            'Final milestone',
    },
];

export type LevelState = {
    config: LevelConfig | null;
    completedTeacherIds: string[];
    completedMilestoneIds: string[];
    lockedHadith: number;
    objectives: ObjectiveStatus[];
    nextObjective: NextObjective;
    tokens: TokenState[];
    isComplete: boolean;
    initializeLevel: (config: LevelConfig) => void;
    completeTeacher: (teacherId: string) => void;
    completeMilestone: (milestoneId: string) => void;
    addLockedHadith: (count: number) => void;
    setNextObjective: (objective: NextObjective) => void;
    collectToken: (tokenId: string) => void;
    addScatteredTokens: (tokens: TokenState[]) => void;
    pruneExpiredTokens: (now: number) => void;
    setComplete: (value: boolean) => void;
};

const initialLevelState = {
    completedMilestoneIds: [] as string[],
    completedTeacherIds: [] as string[],
    config: null as LevelConfig | null,
    isComplete: false,
    lockedHadith: 0,
    nextObjective: null as NextObjective,
    objectives: [] as ObjectiveStatus[],
    tokens: [] as TokenState[],
};

const objectivesMatch = (left: NextObjective, right: NextObjective) => {
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

export const useLevelStore = create<LevelState>()((set) => ({
    ...initialLevelState,
    addLockedHadith: (count) =>
        set((state) => {
            if (!state.config) {
                return state;
            }

            const lockedHadith = state.lockedHadith + count;
            return {
                lockedHadith,
                objectives: buildObjectives(
                    state.config,
                    state.completedTeacherIds,
                    state.completedMilestoneIds,
                    lockedHadith,
                ),
            };
        }),
    addScatteredTokens: (tokens) =>
        set((state) => ({
            tokens: [...state.tokens, ...tokens],
        })),
    collectToken: (tokenId) =>
        set((state) => {
            const token = state.tokens.find((entry) => entry.id === tokenId);
            if (!token || token.collected) {
                return state;
            }

            return {
                tokens: state.tokens.map((entry) =>
                    entry.id === tokenId
                        ? {
                              ...entry,
                              collected: true,
                          }
                        : entry,
                ),
            };
        }),
    completeMilestone: (milestoneId) =>
        set((state) => {
            if (!state.config || state.completedMilestoneIds.includes(milestoneId)) {
                return state;
            }

            const completedMilestoneIds = [...state.completedMilestoneIds, milestoneId];
            return {
                completedMilestoneIds,
                objectives: buildObjectives(
                    state.config,
                    state.completedTeacherIds,
                    completedMilestoneIds,
                    state.lockedHadith,
                ),
            };
        }),
    completeTeacher: (teacherId) =>
        set((state) => {
            if (!state.config || state.completedTeacherIds.includes(teacherId)) {
                return state;
            }

            const completedTeacherIds = [...state.completedTeacherIds, teacherId];
            return {
                completedTeacherIds,
                objectives: buildObjectives(
                    state.config,
                    completedTeacherIds,
                    state.completedMilestoneIds,
                    state.lockedHadith,
                ),
            };
        }),
    initializeLevel: (config) =>
        set({
            completedMilestoneIds: [config.milestones[0]?.id].filter(Boolean) as string[],
            completedTeacherIds: [],
            config,
            isComplete: false,
            lockedHadith: 0,
            nextObjective: null,
            objectives: buildObjectives(config, [], [config.milestones[0]?.id].filter(Boolean) as string[], 0),
            tokens: generateClusterTokens(config.hadithTokenClusters),
        }),
    pruneExpiredTokens: (now) =>
        set((state) => {
            const hasExpiredTokens = state.tokens.some(
                (token) => token.expiresAt !== null && token.expiresAt <= now && !token.collected,
            );

            if (!hasExpiredTokens) {
                return state;
            }

            return {
                tokens: state.tokens.filter((token) => !token.expiresAt || token.expiresAt > now || token.collected),
            };
        }),
    setComplete: (value) =>
        set((state) => {
            if (state.isComplete === value) {
                return state;
            }

            return { isComplete: value };
        }),
    setNextObjective: (nextObjective) =>
        set((state) => {
            if (objectivesMatch(state.nextObjective, nextObjective)) {
                return state;
            }

            return { nextObjective };
        }),
}));

export const resetLevelStore = () => {
    useLevelStore.setState(initialLevelState);
};
