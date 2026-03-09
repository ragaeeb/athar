import { beforeEach, describe, expect, it } from 'vitest';

import { resetGameplaySessionStore, useGameplaySessionStore } from '@/features/gameplay/state/session.store';

describe('session.store', () => {
    beforeEach(() => {
        resetGameplaySessionStore();
    });

    it('toggles pause state explicitly', () => {
        expect(useGameplaySessionStore.getState().paused).toBe(false);

        useGameplaySessionStore.getState().pause();
        expect(useGameplaySessionStore.getState().paused).toBe(true);

        useGameplaySessionStore.getState().resume();
        expect(useGameplaySessionStore.getState().paused).toBe(false);
    });

    it('supports toggling and full session reset', () => {
        useGameplaySessionStore.getState().togglePause();
        expect(useGameplaySessionStore.getState().paused).toBe(true);

        useGameplaySessionStore.getState().resetSession();
        expect(useGameplaySessionStore.getState().paused).toBe(false);
    });
});
