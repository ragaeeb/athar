import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CHARACTER_CONFIGS, type CharacterType, DEFAULT_CHARACTER } from '@/content/characters/characters';
import type { LevelCompletionSummary } from '@/content/levels/types';

export type GameState = {
    currentLevel: number;
    totalHadithVerified: number;
    unlockedLevels: number[];
    selectedCharacter: CharacterType;
    lastCompletion: LevelCompletionSummary | null;
    selectCharacter: (character: CharacterType) => void;
    startLevel: (levelOrder: number) => void;
    unlockLevel: (levelOrder: number) => void;
    addVerifiedHadith: (count: number) => void;
    recordCompletion: (summary: LevelCompletionSummary, nextLevelOrder: number | null) => void;
    clearLastCompletion: () => void;
    resetProgress: () => void;
};

export type GameProgressState = {
    currentLevel: number;
    selectedCharacter: CharacterType;
    totalHadithVerified: number;
    unlockedLevels: number[];
};

export const SAVE_VERSION = 1;

const persistentDefaults = {
    currentLevel: 1,
    selectedCharacter: DEFAULT_CHARACTER,
    totalHadithVerified: 0,
    unlockedLevels: [1],
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isCharacterType = (value: unknown): value is CharacterType =>
    typeof value === 'string' && value in CHARACTER_CONFIGS;

const normalizePositiveInteger = (value: unknown, fallback: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
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

export const migrateGameProgress = (persistedState: unknown): GameProgressState => {
    if (!isRecord(persistedState)) {
        return persistentDefaults;
    }

    const currentLevel = normalizePositiveInteger(persistedState.currentLevel, persistentDefaults.currentLevel);

    return {
        currentLevel,
        selectedCharacter: isCharacterType(persistedState.selectedCharacter)
            ? persistedState.selectedCharacter
            : persistentDefaults.selectedCharacter,
        totalHadithVerified: normalizePositiveInteger(
            persistedState.totalHadithVerified,
            persistentDefaults.totalHadithVerified,
        ),
        unlockedLevels: normalizeUnlockedLevels(persistedState.unlockedLevels, currentLevel),
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
            addVerifiedHadith: (count) =>
                set((state) => ({
                    totalHadithVerified: state.totalHadithVerified + count,
                })),
            clearLastCompletion: () => set({ lastCompletion: null }),
            lastCompletion: null,
            recordCompletion: (summary, nextLevelOrder) =>
                set((state) => ({
                    currentLevel: nextLevelOrder ?? state.currentLevel,
                    lastCompletion: summary,
                    unlockedLevels:
                        nextLevelOrder === null || state.unlockedLevels.includes(nextLevelOrder)
                            ? state.unlockedLevels
                            : [...state.unlockedLevels, nextLevelOrder].sort((left, right) => left - right),
                })),
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
                selectedCharacter: state.selectedCharacter,
                totalHadithVerified: state.totalHadithVerified,
                unlockedLevels: state.unlockedLevels,
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
