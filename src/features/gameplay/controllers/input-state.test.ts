import { beforeEach, describe, expect, it } from 'vitest';

import {
    clearInputState,
    getMovementInputSnapshot,
    setInputKeyPressed,
    setTouchMovementInput,
} from '@/features/gameplay/controllers/input-state';

describe('input-state', () => {
    beforeEach(() => {
        clearInputState();
    });

    it('combines keyboard and touch movement through the shared movement contract', () => {
        setInputKeyPressed('d', true);
        setTouchMovementInput({ moveX: 0.25, moveZ: 0.5, runRequested: false });

        expect(getMovementInputSnapshot()).toEqual({
            moveX: 1,
            moveZ: 0.5,
            runRequested: false,
        });
    });

    it('clears both keyboard and touch state together', () => {
        setInputKeyPressed('w', true);
        setTouchMovementInput({ moveX: -0.5, moveZ: 0.25, runRequested: true });

        clearInputState();

        expect(getMovementInputSnapshot()).toEqual({
            moveX: 0,
            moveZ: 0,
            runRequested: false,
        });
    });
});
