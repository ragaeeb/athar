import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearInputState, getMovementInputSnapshot } from '@/features/gameplay/controllers/input-state';
import { TouchControls } from '@/features/gameplay/controllers/TouchControls';
import { resetLevelStore } from '@/features/gameplay/state/level.store';
import { resetPlayerStore } from '@/features/gameplay/state/player.store';
import { resetGameplaySessionStore } from '@/features/gameplay/state/session.store';

describe('TouchControls', () => {
    beforeEach(() => {
        clearInputState();
        resetGameplaySessionStore();
        resetPlayerStore();
        resetLevelStore();
        Object.defineProperty(navigator, 'maxTouchPoints', {
            configurable: true,
            value: 1,
        });
    });

    it('drives movement input from the touch pad and clears it on release', async () => {
        render(<TouchControls />);

        const pad = await screen.findByTestId('touch-movement-pad');
        vi.spyOn(pad, 'getBoundingClientRect').mockReturnValue({
            bottom: 112,
            height: 112,
            left: 0,
            right: 112,
            toJSON: () => ({}),
            top: 0,
            width: 112,
            x: 0,
            y: 0,
        });

        fireEvent.pointerDown(pad, {
            buttons: 1,
            clientX: 112,
            clientY: 56,
            pointerId: 1,
        });
        expect(getMovementInputSnapshot().moveX).toBeGreaterThan(0.9);

        fireEvent.pointerUp(pad, {
            pointerId: 1,
        });
        expect(getMovementInputSnapshot()).toEqual({ moveX: 0, moveZ: 0, runRequested: false });
    });

    it('releases pointer capture when a pointer cancel interrupts touch movement', async () => {
        render(<TouchControls />);

        const pad = await screen.findByTestId('touch-movement-pad');
        vi.spyOn(pad, 'getBoundingClientRect').mockReturnValue({
            bottom: 112,
            height: 112,
            left: 0,
            right: 112,
            toJSON: () => ({}),
            top: 0,
            width: 112,
            x: 0,
            y: 0,
        });

        const setPointerCapture = vi.fn();
        const releasePointerCapture = vi.fn();
        Object.defineProperty(pad, 'setPointerCapture', {
            configurable: true,
            value: setPointerCapture,
        });
        Object.defineProperty(pad, 'releasePointerCapture', {
            configurable: true,
            value: releasePointerCapture,
        });

        fireEvent.pointerDown(pad, {
            buttons: 1,
            clientX: 112,
            clientY: 56,
            pointerId: 9,
        });
        expect(setPointerCapture).toHaveBeenCalledWith(9);
        expect(getMovementInputSnapshot().moveX).toBeGreaterThan(0.9);

        fireEvent.pointerCancel(pad, { pointerId: 9 });

        expect(releasePointerCapture).toHaveBeenCalledWith(9);
        expect(getMovementInputSnapshot()).toEqual({ moveX: 0, moveZ: 0, runRequested: false });
    });
});
