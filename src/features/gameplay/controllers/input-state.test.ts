import { beforeEach, describe, expect, it } from 'vitest';

import {
    clearInputState,
    getMovementInputSnapshot,
    setInputKeyPressed,
} from '@/features/gameplay/controllers/input-state';

describe('input-state', () => {
    beforeEach(() => {
        clearInputState();
    });

    it('normalizes keys so caps lock does not break WASD', () => {
        setInputKeyPressed('D', true);
        setInputKeyPressed('W', true);

        expect(getMovementInputSnapshot()).toEqual({
            moveX: 1,
            moveZ: 1,
        });
    });

    it('tracks arrow keys through normalized lowercase names', () => {
        setInputKeyPressed('ArrowLeft', true);
        setInputKeyPressed('ArrowDown', true);

        expect(getMovementInputSnapshot()).toEqual({
            moveX: -1,
            moveZ: -1,
        });
    });
});
