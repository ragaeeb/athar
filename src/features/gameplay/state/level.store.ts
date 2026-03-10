import { create } from 'zustand';
import type { LevelConfig, NextObjective, ObjectiveStatus, TokenState } from '@/content/levels/types';
import { nextObjectivesMatch } from '@/features/gameplay/objective-utils';
import { buildObjectiveStatuses, getChapterHadithTotal } from '@/features/gameplay/objectives';
import type { SimulationLevelState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { generateClusterTokens } from '@/shared/geo';

const getCurrentChapterHadithTotal = (lockedHadith: number) =>
    getChapterHadithTotal(lockedHadith, usePlayerStore.getState().hadithTokens);

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
    syncFromSimulation: (levelState: SimulationLevelState) => void;
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

type LevelStoreSimulationSnapshot = Pick<
    LevelState,
    | 'completedMilestoneIds'
    | 'completedTeacherIds'
    | 'isComplete'
    | 'lockedHadith'
    | 'nextObjective'
    | 'objectives'
    | 'tokens'
>;

type LevelSyncChanges = {
    completedMilestoneIdsChanged: boolean;
    completedTeacherIdsChanged: boolean;
    isCompleteChanged: boolean;
    lockedHadithChanged: boolean;
    nextObjectiveChanged: boolean;
    objectivesChanged: boolean;
    tokensChanged: boolean;
};

const stringArraysMatch = (left: string[], right: string[]) =>
    left.length === right.length && left.every((value, index) => value === right[index]);

const objectiveStatusesMatch = (left: ObjectiveStatus[], right: ObjectiveStatus[]) =>
    left.length === right.length &&
    left.every(
        (entry, index) =>
            entry.completed === right[index]?.completed &&
            entry.detail === right[index]?.detail &&
            entry.id === right[index]?.id &&
            entry.kind === right[index]?.kind &&
            entry.label === right[index]?.label,
    );

const tokensMatch = (left: TokenState[], right: TokenState[]) =>
    left.length === right.length &&
    left.every((token, index) => {
        const other = right[index];
        return (
            token.id === other?.id &&
            token.kind === other?.kind &&
            token.clusterId === other?.clusterId &&
            token.value === other?.value &&
            token.collected === other?.collected &&
            token.expiresAt === other?.expiresAt &&
            token.bounceSeed === other?.bounceSeed &&
            token.coords.lat === other?.coords.lat &&
            token.coords.lng === other?.coords.lng &&
            token.anchor.lat === other?.anchor.lat &&
            token.anchor.lng === other?.anchor.lng &&
            token.localOffsetMeters.x === other?.localOffsetMeters.x &&
            token.localOffsetMeters.z === other?.localOffsetMeters.z
        );
    });

const cloneNextObjective = (objective: NextObjective): NextObjective =>
    objective
        ? {
              ...objective,
              coords: { ...objective.coords },
          }
        : null;

const cloneObjectives = (objectives: ObjectiveStatus[]) => objectives.map((objective) => ({ ...objective }));

const cloneTokens = (tokens: TokenState[]) =>
    tokens.map((token) => ({
        ...token,
        anchor: { ...token.anchor },
        coords: { ...token.coords },
        localOffsetMeters: { ...token.localOffsetMeters },
    }));

const getLevelSyncChanges = (state: LevelState, levelState: SimulationLevelState): LevelSyncChanges => ({
    completedMilestoneIdsChanged: !stringArraysMatch(state.completedMilestoneIds, levelState.completedMilestoneIds),
    completedTeacherIdsChanged: !stringArraysMatch(state.completedTeacherIds, levelState.completedTeacherIds),
    isCompleteChanged: state.isComplete !== levelState.isComplete,
    lockedHadithChanged: state.lockedHadith !== levelState.lockedHadith,
    nextObjectiveChanged: !nextObjectivesMatch(state.nextObjective, levelState.nextObjective),
    objectivesChanged: !objectiveStatusesMatch(state.objectives, levelState.objectives),
    tokensChanged: !tokensMatch(state.tokens, levelState.tokens),
});

const hasLevelSyncChanges = (changes: LevelSyncChanges) =>
    changes.completedMilestoneIdsChanged ||
    changes.completedTeacherIdsChanged ||
    changes.isCompleteChanged ||
    changes.lockedHadithChanged ||
    changes.nextObjectiveChanged ||
    changes.objectivesChanged ||
    changes.tokensChanged;

const buildSyncedLevelState = (
    state: LevelState,
    levelState: SimulationLevelState,
): LevelStoreSimulationSnapshot | null => {
    const changes = getLevelSyncChanges(state, levelState);

    if (!hasLevelSyncChanges(changes)) {
        return null;
    }

    return {
        completedMilestoneIds: changes.completedMilestoneIdsChanged
            ? [...levelState.completedMilestoneIds]
            : state.completedMilestoneIds,
        completedTeacherIds: changes.completedTeacherIdsChanged
            ? [...levelState.completedTeacherIds]
            : state.completedTeacherIds,
        isComplete: changes.isCompleteChanged ? levelState.isComplete : state.isComplete,
        lockedHadith: changes.lockedHadithChanged ? levelState.lockedHadith : state.lockedHadith,
        nextObjective: changes.nextObjectiveChanged
            ? cloneNextObjective(levelState.nextObjective)
            : state.nextObjective,
        objectives: changes.objectivesChanged ? cloneObjectives(levelState.objectives) : state.objectives,
        tokens: changes.tokensChanged ? cloneTokens(levelState.tokens) : state.tokens,
    };
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
                objectives: buildObjectiveStatuses(
                    state.config,
                    state.completedTeacherIds,
                    state.completedMilestoneIds,
                    getCurrentChapterHadithTotal(lockedHadith),
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
                objectives: buildObjectiveStatuses(
                    state.config,
                    state.completedTeacherIds,
                    completedMilestoneIds,
                    getCurrentChapterHadithTotal(state.lockedHadith),
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
                objectives: buildObjectiveStatuses(
                    state.config,
                    completedTeacherIds,
                    state.completedMilestoneIds,
                    getCurrentChapterHadithTotal(state.lockedHadith),
                ),
            };
        }),
    initializeLevel: (config) =>
        set({
            // The route always starts inside the authored departure city, so the first milestone is pre-completed.
            completedMilestoneIds: [config.milestones[0]?.id].filter(Boolean) as string[],
            completedTeacherIds: [],
            config,
            isComplete: false,
            lockedHadith: 0,
            nextObjective: null,
            objectives: buildObjectiveStatuses(
                config,
                [],
                [config.milestones[0]?.id].filter(Boolean) as string[],
                getCurrentChapterHadithTotal(0),
            ),
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
            if (nextObjectivesMatch(state.nextObjective, nextObjective)) {
                return state;
            }

            return { nextObjective };
        }),
    syncFromSimulation: (levelState) =>
        set((state) => {
            const nextState = buildSyncedLevelState(state, levelState);
            return nextState ?? state;
        }),
}));

export const resetLevelStore = () => {
    useLevelStore.setState(initialLevelState);
};
