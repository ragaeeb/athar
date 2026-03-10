import { beforeEach, describe, expect, it } from 'vitest';

import { migrateGameProgress, resetGameStore, SAVE_VERSION, useGameStore } from '@/features/gameplay/state/game.store';

const createCompletionSummary = (
    verifiedHadith: number,
    overrides: Partial<{
        levelId: string;
        levelName: string;
        levelSubtitle: string;
        teachersMet: number;
    }> = {},
) => ({
    completionNarration: 'Narration',
    historicalNote: 'Historical note',
    levelId: overrides.levelId ?? 'level-1',
    levelName: overrides.levelName ?? 'Level 1',
    levelSubtitle: overrides.levelSubtitle ?? 'The First Steps: Bukhara to Makkah',
    teachersMet: overrides.teachersMet ?? 1,
    timeTakenSeconds: 84,
    tokensLost: 6,
    verifiedHadith,
});

describe('game.store migrations', () => {
    beforeEach(() => {
        resetGameStore();
    });

    it('exports a stable save version', () => {
        expect(SAVE_VERSION).toBe(2);
    });

    it('normalizes malformed persisted progression safely', () => {
        expect(
            migrateGameProgress({
                currentLevel: 3,
                legacyVerifiedHadithBalance: -4,
                selectedCharacter: 'not-a-scholar',
                totalHadithVerified: 18,
                unlockedLevels: [3, 2, 'bad', 1, 2],
                verifiedHadithByLevel: {
                    broken: 'bad',
                    'level-1': 12,
                    'level-2': -3,
                },
            }),
        ).toEqual({
            currentLevel: 3,
            legacyVerifiedHadithBalance: 6,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 18,
            unlockedLevels: [1, 2, 3],
            verifiedHadithByLevel: {
                'level-1': 12,
            },
        });
    });

    it('falls back to default progression when persisted state is missing', () => {
        expect(migrateGameProgress(null)).toEqual({
            currentLevel: 1,
            legacyVerifiedHadithBalance: 0,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 0,
            unlockedLevels: [1],
            verifiedHadithByLevel: {},
        });
    });

    it('clamps invalid currentLevel values below 1 during migration', () => {
        expect(
            migrateGameProgress({
                currentLevel: 0,
                unlockedLevels: [2],
            }),
        ).toEqual({
            currentLevel: 1,
            legacyVerifiedHadithBalance: 0,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 0,
            unlockedLevels: [1, 2],
            verifiedHadithByLevel: {},
        });

        expect(
            migrateGameProgress({
                currentLevel: 0.9,
                unlockedLevels: [],
            }),
        ).toEqual({
            currentLevel: 1,
            legacyVerifiedHadithBalance: 0,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 0,
            unlockedLevels: [1],
            verifiedHadithByLevel: {},
        });
    });

    it('records only the highest verified hadith total per level across replays', () => {
        useGameStore.getState().recordCompletion(createCompletionSummary(30), 2);

        expect(useGameStore.getState().totalHadithVerified).toBe(30);
        expect(useGameStore.getState().verifiedHadithByLevel).toEqual({ 'level-1': 30 });

        useGameStore.getState().recordCompletion(createCompletionSummary(18), 2);

        expect(useGameStore.getState().totalHadithVerified).toBe(30);
        expect(useGameStore.getState().verifiedHadithByLevel).toEqual({ 'level-1': 30 });

        useGameStore.getState().recordCompletion(createCompletionSummary(34), 2);

        expect(useGameStore.getState().totalHadithVerified).toBe(34);
        expect(useGameStore.getState().verifiedHadithByLevel).toEqual({ 'level-1': 34 });
    });

    it('keeps replay-safe verified totals isolated per level when level two is replayed', () => {
        useGameStore.getState().recordCompletion(createCompletionSummary(30), 2);
        useGameStore.getState().recordCompletion(
            createCompletionSummary(36, {
                levelId: 'level-2',
                levelName: 'Level 2',
                levelSubtitle: 'The Arabian Heartland: Makkah to Madinah',
                teachersMet: 3,
            }),
            3,
        );

        expect(useGameStore.getState().totalHadithVerified).toBe(66);
        expect(useGameStore.getState().verifiedHadithByLevel).toEqual({
            'level-1': 30,
            'level-2': 36,
        });

        useGameStore.getState().recordCompletion(
            createCompletionSummary(28, {
                levelId: 'level-2',
                levelName: 'Level 2',
                levelSubtitle: 'The Arabian Heartland: Makkah to Madinah',
                teachersMet: 3,
            }),
            3,
        );

        expect(useGameStore.getState().totalHadithVerified).toBe(66);
        expect(useGameStore.getState().verifiedHadithByLevel).toEqual({
            'level-1': 30,
            'level-2': 36,
        });

        useGameStore.getState().recordCompletion(
            createCompletionSummary(40, {
                levelId: 'level-2',
                levelName: 'Level 2',
                levelSubtitle: 'The Arabian Heartland: Makkah to Madinah',
                teachersMet: 3,
            }),
            3,
        );

        expect(useGameStore.getState().totalHadithVerified).toBe(70);
        expect(useGameStore.getState().verifiedHadithByLevel).toEqual({
            'level-1': 30,
            'level-2': 40,
        });
    });

    it('consumes legacy unattributed totals conservatively during the first replay-safe completion', () => {
        useGameStore.setState({
            ...migrateGameProgress({
                currentLevel: 1,
                totalHadithVerified: 30,
                unlockedLevels: [1],
            }),
            lastCompletion: null,
        });

        useGameStore.getState().recordCompletion(createCompletionSummary(30), 2);

        expect(useGameStore.getState().legacyVerifiedHadithBalance).toBe(0);
        expect(useGameStore.getState().totalHadithVerified).toBe(30);
        expect(useGameStore.getState().verifiedHadithByLevel).toEqual({ 'level-1': 30 });
    });

    it('does not unlock a nonexistent level after the final chapter completes', () => {
        useGameStore.setState({
            currentLevel: 5,
            lastCompletion: null,
            legacyVerifiedHadithBalance: 0,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 166,
            unlockedLevels: [1, 2, 3, 4, 5],
            verifiedHadithByLevel: {
                'level-1': 30,
                'level-2': 36,
                'level-3': 48,
                'level-4': 52,
            },
        });

        useGameStore.getState().recordCompletion(
            createCompletionSummary(60, {
                levelId: 'level-5',
                levelName: 'Level 5',
                levelSubtitle: 'The Grand Finale: Syria, Egypt, and the Compilation',
                teachersMet: 2,
            }),
            null,
        );

        expect(useGameStore.getState().currentLevel).toBe(5);
        expect(useGameStore.getState().unlockedLevels).toEqual([1, 2, 3, 4, 5]);
        expect(useGameStore.getState().totalHadithVerified).toBe(226);
        expect(useGameStore.getState().verifiedHadithByLevel).toEqual({
            'level-1': 30,
            'level-2': 36,
            'level-3': 48,
            'level-4': 52,
            'level-5': 60,
        });
    });
});
