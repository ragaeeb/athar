import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CHARACTER_CONFIGS, type CharacterType, DEFAULT_CHARACTER } from '@/content/characters/characters';
import type { LevelCompletionSummary } from '@/content/levels/types';

export type GameState = {
    currentLevel: number;
    legacyVerifiedHadithBalance: number;
    totalHadithVerified: number;
    unlockedLevels: number[];
    verifiedHadithByLevel: Record<string, number>;
    selectedCharacter: CharacterType;
    lastCompletion: LevelCompletionSummary | null;
    selectCharacter: (character: CharacterType) => void;
    startLevel: (levelOrder: number) => void;
    unlockLevel: (levelOrder: number) => void;
    recordCompletion: (summary: LevelCompletionSummary, nextLevelOrder: number | null) => void;
    clearLastCompletion: () => void;
    resetProgress: () => void;
};

export type GameProgressState = {
    currentLevel: number;
    legacyVerifiedHadithBalance: number;
    selectedCharacter: CharacterType;
    totalHadithVerified: number;
    unlockedLevels: number[];
    verifiedHadithByLevel: Record<string, number>;
};

export const SAVE_VERSION = 2;

const persistentDefaults = {
    currentLevel: 1,
    legacyVerifiedHadithBalance: 0,
    selectedCharacter: DEFAULT_CHARACTER,
    totalHadithVerified: 0,
    unlockedLevels: [1],
    verifiedHadithByLevel: {} as Record<string, number>,
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isCharacterType = (value: unknown): value is CharacterType =>
    typeof value === 'string' && value in CHARACTER_CONFIGS;

const normalizeIntegerAtLeast = (value: unknown, fallback: number, minimum = 0) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
        return fallback;
    }

    return Math.floor(value);
};

const normalizeUnlockedLevels = (value: unknown, currentLevel: number) => {
    const levels =
        Array.isArray(value) && value.length > 0
            ? value
                  .filter((entry): entry is number => typeof entry === 'number' && Number.isInteger(entry) && entry > 0)
                  .sort((left, right) => left - right)
            : [];

    return [...new Set([1, currentLevel, ...levels])].sort((left, right) => left - right);
};

const normalizeVerifiedHadithByLevel = (value: unknown) => {
    if (!isRecord(value)) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(value).flatMap(([levelId, verifiedHadith]) => {
            if (typeof levelId !== 'string') {
                return [];
            }

            const normalizedVerifiedHadith = normalizeIntegerAtLeast(verifiedHadith, -1);
            return normalizedVerifiedHadith >= 0 ? [[levelId, normalizedVerifiedHadith]] : [];
        }),
    );
};

const sumVerifiedHadithByLevel = (verifiedHadithByLevel: Record<string, number>) =>
    Object.values(verifiedHadithByLevel).reduce((total, verifiedHadith) => total + verifiedHadith, 0);

export const migrateGameProgress = (persistedState: unknown): GameProgressState => {
    if (!isRecord(persistedState)) {
        return persistentDefaults;
    }

    const currentLevel = normalizeIntegerAtLeast(persistedState.currentLevel, persistentDefaults.currentLevel, 1);
    const verifiedHadithByLevel = normalizeVerifiedHadithByLevel(persistedState.verifiedHadithByLevel);
    const attributedVerifiedHadith = sumVerifiedHadithByLevel(verifiedHadithByLevel);
    const normalizedTotalHadithVerified = normalizeIntegerAtLeast(
        persistedState.totalHadithVerified,
        persistentDefaults.totalHadithVerified,
    );
    const legacyVerifiedHadithBalance = normalizeIntegerAtLeast(
        persistedState.legacyVerifiedHadithBalance,
        Math.max(0, normalizedTotalHadithVerified - attributedVerifiedHadith),
    );

    return {
        currentLevel,
        legacyVerifiedHadithBalance,
        selectedCharacter: isCharacterType(persistedState.selectedCharacter)
            ? persistedState.selectedCharacter
            : persistentDefaults.selectedCharacter,
        totalHadithVerified: attributedVerifiedHadith + legacyVerifiedHadithBalance,
        unlockedLevels: normalizeUnlockedLevels(persistedState.unlockedLevels, currentLevel),
        verifiedHadithByLevel,
    };
};

const createSafeStorage = () => {
    if (typeof window !== 'undefined') {
        const candidate = window.localStorage as Partial<Storage>;
        if (
            typeof candidate.getItem === 'function' &&
            typeof candidate.setItem === 'function' &&
            typeof candidate.removeItem === 'function'
        ) {
            return candidate as Storage;
        }
    }

    return {
        clear: () => {},
        getItem: () => null,
        key: () => null,
        get length() {
            return 0;
        },
        removeItem: () => {},
        setItem: () => {},
    } satisfies Storage;
};

export const useGameStore = create<GameState>()(
    persist(
        (set) => ({
            ...persistentDefaults,
            clearLastCompletion: () => set({ lastCompletion: null }),
            lastCompletion: null,
            recordCompletion: (summary, nextLevelOrder) =>
                set((state) => {
                    const previousVerifiedHadith = state.verifiedHadithByLevel[summary.levelId] ?? 0;
                    const nextVerifiedHadith = Math.max(previousVerifiedHadith, summary.verifiedHadith);
                    const newlyAttributedHadith = nextVerifiedHadith - previousVerifiedHadith;
                    const consumedLegacyBalance = Math.min(state.legacyVerifiedHadithBalance, newlyAttributedHadith);
                    const legacyVerifiedHadithBalance = state.legacyVerifiedHadithBalance - consumedLegacyBalance;
                    const verifiedHadithByLevel =
                        nextVerifiedHadith === previousVerifiedHadith
                            ? state.verifiedHadithByLevel
                            : {
                                  ...state.verifiedHadithByLevel,
                                  [summary.levelId]: nextVerifiedHadith,
                              };

                    return {
                        currentLevel: nextLevelOrder ?? state.currentLevel,
                        lastCompletion: summary,
                        legacyVerifiedHadithBalance,
                        totalHadithVerified:
                            legacyVerifiedHadithBalance + sumVerifiedHadithByLevel(verifiedHadithByLevel),
                        unlockedLevels:
                            nextLevelOrder === null || state.unlockedLevels.includes(nextLevelOrder)
                                ? state.unlockedLevels
                                : [...state.unlockedLevels, nextLevelOrder].sort((left, right) => left - right),
                        verifiedHadithByLevel,
                    };
                }),
            resetProgress: () =>
                set({
                    ...persistentDefaults,
                    lastCompletion: null,
                }),
            selectCharacter: (character) => set({ selectedCharacter: character }),
            startLevel: (levelOrder) => set({ currentLevel: levelOrder }),
            unlockLevel: (levelOrder) =>
                set((state) => ({
                    unlockedLevels: state.unlockedLevels.includes(levelOrder)
                        ? state.unlockedLevels
                        : [...state.unlockedLevels, levelOrder].sort((left, right) => left - right),
                })),
        }),
        {
            migrate: (persistedState) => migrateGameProgress(persistedState),
            name: 'athar-progression',
            partialize: (state) => ({
                currentLevel: state.currentLevel,
                legacyVerifiedHadithBalance: state.legacyVerifiedHadithBalance,
                selectedCharacter: state.selectedCharacter,
                totalHadithVerified: state.totalHadithVerified,
                unlockedLevels: state.unlockedLevels,
                verifiedHadithByLevel: state.verifiedHadithByLevel,
            }),
            storage: createJSONStorage(createSafeStorage),
            version: SAVE_VERSION,
        },
    ),
);

export const resetGameStore = () => {
    useGameStore.setState({
        ...persistentDefaults,
        lastCompletion: null,
    });
    useGameStore.persist.clearStorage();
};
