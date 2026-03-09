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
});
