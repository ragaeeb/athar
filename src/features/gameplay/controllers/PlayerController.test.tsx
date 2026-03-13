import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { level1 } from '@/content/levels/level-1/config';
import { clearInputState, getMovementInputSnapshot, getPressedKeys } from '@/features/gameplay/controllers/input-state';
import { PlayerController } from '@/features/gameplay/controllers/PlayerController';
import { resetPlayerStore, usePlayerStore } from '@/features/gameplay/state/player.store';
import { resetGameplaySessionStore, useGameplaySessionStore } from '@/features/gameplay/state/session.store';

describe('PlayerController', () => {
    beforeEach(() => {
        clearInputState();
        resetGameplaySessionStore();
        resetPlayerStore();
    });

    it('toggles pause with Escape and clears pressed movement keys', () => {
        render(<PlayerController />);

        fireEvent.keyDown(window, { key: 'ArrowDown' });
        expect(getPressedKeys()).toEqual(['arrowdown']);
        expect(getMovementInputSnapshot()).toEqual({ moveX: 0, moveZ: -1, runRequested: false });

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(useGameplaySessionStore.getState().paused).toBe(true);
        expect(getPressedKeys()).toEqual([]);
        expect(getMovementInputSnapshot()).toEqual({ moveX: 0, moveZ: 0, runRequested: false });

        fireEvent.keyDown(window, { key: 'ArrowRight' });
        expect(getPressedKeys()).toEqual([]);

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(useGameplaySessionStore.getState().paused).toBe(false);

        fireEvent.keyDown(window, { key: 'ArrowRight' });
        expect(getPressedKeys()).toEqual(['arrowright']);
        expect(getMovementInputSnapshot()).toEqual({ moveX: 1, moveZ: 0, runRequested: false });
    });

    it('captures shift as a run request and clears it on keyup', () => {
        render(<PlayerController />);

        fireEvent.keyDown(window, { key: 'Shift' });
        fireEvent.keyDown(window, { key: 'w' });

        expect(getMovementInputSnapshot()).toEqual({ moveX: 0, moveZ: 1, runRequested: true });

        fireEvent.keyUp(window, { key: 'Shift' });

        expect(getMovementInputSnapshot()).toEqual({ moveX: 0, moveZ: 1, runRequested: false });
    });

    it('does not toggle pause while dialogue is open', () => {
        render(<PlayerController />);

        usePlayerStore.getState().openDialogue(level1.teachers[0]!);
        fireEvent.keyDown(window, { key: 'Escape' });

        expect(useGameplaySessionStore.getState().paused).toBe(false);
    });
});
