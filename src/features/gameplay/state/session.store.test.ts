import { beforeEach, describe, expect, it } from 'vitest';

import { resetGameplaySessionStore, useGameplaySessionStore } from '@/features/gameplay/state/session.store';

describe('session.store', () => {
    beforeEach(() => {
        resetGameplaySessionStore();
    });

    it('tracks onboarding dismissal inside the session only', () => {
        useGameplaySessionStore.getState().dismissOnboarding();
        expect(useGameplaySessionStore.getState().onboardingDismissed).toBe(true);

        resetGameplaySessionStore();
        expect(useGameplaySessionStore.getState().onboardingDismissed).toBe(false);
    });

    it('stores and clears transient encounter feedback inside the session only', () => {
        useGameplaySessionStore.getState().showEncounterFeedback({
            detail: 'Confiscated 4 carried hadith.',
            durationMs: 1_500,
            title: 'Corrupt Guard',
            tone: 'danger',
        });

        expect(useGameplaySessionStore.getState().encounterFeedback).toEqual(
            expect.objectContaining({
                detail: 'Confiscated 4 carried hadith.',
                title: 'Corrupt Guard',
                tone: 'danger',
            }),
        );

        useGameplaySessionStore.getState().clearEncounterFeedback();
        expect(useGameplaySessionStore.getState().encounterFeedback).toBeNull();

        resetGameplaySessionStore();
        expect(useGameplaySessionStore.getState().encounterFeedback).toBeNull();
        expect(useGameplaySessionStore.getState().defeat).toBeNull();
        expect(useGameplaySessionStore.getState().paused).toBe(false);
    });

    it('stores defeat state and pauses the session until the session is reset', () => {
        useGameplaySessionStore.getState().showDefeat({
            detail: 'The scorpion struck before escape.',
            title: 'Scorpion Ambush',
        });

        expect(useGameplaySessionStore.getState().defeat).toEqual({
            detail: 'The scorpion struck before escape.',
            title: 'Scorpion Ambush',
        });
        expect(useGameplaySessionStore.getState().paused).toBe(true);

        useGameplaySessionStore.getState().clearDefeat();
        expect(useGameplaySessionStore.getState().defeat).toBeNull();
        expect(useGameplaySessionStore.getState().paused).toBe(true);

        resetGameplaySessionStore();
        expect(useGameplaySessionStore.getState().defeat).toBeNull();
        expect(useGameplaySessionStore.getState().encounterFeedback).toBeNull();
        expect(useGameplaySessionStore.getState().paused).toBe(false);
    });
});
