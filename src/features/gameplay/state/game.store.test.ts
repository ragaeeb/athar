import { describe, expect, it } from 'vitest';

import { migrateGameProgress, SAVE_VERSION } from '@/features/gameplay/state/game.store';

describe('game.store migrations', () => {
    it('exports a stable save version', () => {
        expect(SAVE_VERSION).toBe(1);
    });

    it('normalizes malformed persisted progression safely', () => {
        expect(
            migrateGameProgress({
                currentLevel: 3,
                selectedCharacter: 'not-a-scholar',
                totalHadithVerified: -4,
                unlockedLevels: [3, 2, 'bad', 1, 2],
            }),
        ).toEqual({
            currentLevel: 3,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 0,
            unlockedLevels: [1, 2, 3],
        });
    });

    it('falls back to default progression when persisted state is missing', () => {
        expect(migrateGameProgress(null)).toEqual({
            currentLevel: 1,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 0,
            unlockedLevels: [1],
        });
    });
});
