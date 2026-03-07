import { beforeEach, describe, expect, it } from 'vitest';

import { resolveNextObjective } from '@/game/engine/CollisionSystem';
import { level1 } from '@/game/levels/level1';
import { resetGameStore, useGameStore } from '@/game/store/game.store';
import { resetLevelStore, useLevelStore } from '@/game/store/level.store';
import { resetPlayerStore, usePlayerStore } from '@/game/store/player.store';
import { generateScatterTokens } from '@/lib/geo';

describe('gameplay stores', () => {
    beforeEach(() => {
        resetGameStore();
        resetLevelStore();
        resetPlayerStore();
    });

    it('banks tokens into locked hadith and permanent progression', () => {
        useLevelStore.getState().initializeLevel(level1);
        usePlayerStore.getState().addToken(14);

        const banked = usePlayerStore.getState().bankTokens();
        useLevelStore.getState().addLockedHadith(banked);
        useGameStore.getState().addVerifiedHadith(banked);

        expect(banked).toBe(14);
        expect(usePlayerStore.getState().hadithTokens).toBe(0);
        expect(useLevelStore.getState().lockedHadith).toBe(14);
        expect(useGameStore.getState().totalHadithVerified).toBe(14);
    });

    it('loses half of carried tokens and clears expired scattered tokens', () => {
        usePlayerStore.getState().initializePlayer(level1.milestones[0]?.coords ?? level1.origin, level1.origin);
        usePlayerStore.getState().addToken(9);

        const expiresAt = Date.now() + 8_000;
        const scatter = generateScatterTokens(usePlayerStore.getState().coords, 4, expiresAt);
        usePlayerStore.getState().loseTokens(4, scatter, Date.now());

        expect(usePlayerStore.getState().hadithTokens).toBe(5);
        expect(usePlayerStore.getState().hitTokens).toHaveLength(4);
        expect(usePlayerStore.getState().tokensLost).toBe(4);

        usePlayerStore.getState().clearExpiredHitTokens(expiresAt + 1);

        expect(usePlayerStore.getState().hitTokens).toHaveLength(0);
        expect(usePlayerStore.getState().isHit).toBe(false);
    });

    it('prioritizes required teachers before milestones and token clusters', () => {
        useLevelStore.getState().initializeLevel(level1);

        const firstObjective = resolveNextObjective(
            level1,
            useLevelStore.getState().completedTeacherIds,
            useLevelStore.getState().completedMilestoneIds,
            useLevelStore.getState().tokens,
        );

        expect(firstObjective && 'name' in firstObjective ? firstObjective.name : '').toBe('Makki ibn Ibrahim');

        useLevelStore.getState().completeTeacher('makki-ibn-ibrahim');

        const secondObjective = resolveNextObjective(
            level1,
            useLevelStore.getState().completedTeacherIds,
            useLevelStore.getState().completedMilestoneIds,
            useLevelStore.getState().tokens,
        );

        expect(secondObjective && 'label' in secondObjective ? secondObjective.label : '').toBe('Merv Crossing');
    });
});
