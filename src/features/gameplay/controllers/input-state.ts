type KeyState = Record<string, boolean>;

type MovementInput = {
    moveX: number;
    moveZ: number;
};

const keyState: KeyState = {};

export const setInputKeyPressed = (key: string, pressed: boolean) => {
    keyState[key] = pressed;
};

export const clearInputState = () => {
    for (const key of Object.keys(keyState)) {
        delete keyState[key];
    }
};

export const getPressedKeys = () => Object.keys(keyState).filter((key) => keyState[key]);

export const getMovementInputSnapshot = (): MovementInput => ({
    moveX: (keyState.d || keyState.ArrowRight ? 1 : 0) - (keyState.a || keyState.ArrowLeft ? 1 : 0),
    moveZ: (keyState.w || keyState.ArrowUp ? 1 : 0) - (keyState.s || keyState.ArrowDown ? 1 : 0),
});
