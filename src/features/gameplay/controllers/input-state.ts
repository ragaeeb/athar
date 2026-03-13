type KeyState = Record<string, boolean>;

type MovementInput = {
    moveX: number;
    moveZ: number;
    runRequested: boolean;
};

const keyState: KeyState = {};
const touchState: MovementInput = {
    moveX: 0,
    moveZ: 0,
    runRequested: false,
};

const clampAxis = (value: number) => Math.max(-1, Math.min(1, value));

export const setInputKeyPressed = (key: string, pressed: boolean) => {
    keyState[key.toLowerCase()] = pressed;
};

export const setTouchMovementInput = (movement: MovementInput) => {
    touchState.moveX = clampAxis(movement.moveX);
    touchState.moveZ = clampAxis(movement.moveZ);
    touchState.runRequested = movement.runRequested;
};

export const clearTouchMovementInput = () => {
    touchState.moveX = 0;
    touchState.moveZ = 0;
    touchState.runRequested = false;
};

export const clearInputState = () => {
    for (const key of Object.keys(keyState)) {
        delete keyState[key];
    }

    clearTouchMovementInput();
};

export const getPressedKeys = () => Object.keys(keyState).filter((key) => keyState[key]);

export const getMovementInputSnapshot = (): MovementInput => ({
    moveX: clampAxis(
        (keyState.d || keyState.arrowright ? 1 : 0) - (keyState.a || keyState.arrowleft ? 1 : 0) + touchState.moveX,
    ),
    moveZ: clampAxis(
        (keyState.w || keyState.arrowup ? 1 : 0) - (keyState.s || keyState.arrowdown ? 1 : 0) + touchState.moveZ,
    ),
    runRequested: Boolean(keyState.shift || touchState.runRequested),
});
