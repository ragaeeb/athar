export const DEFAULT_MOVEMENT_SPEED_MULTIPLIER = 1;
export const MIN_MOVEMENT_SPEED_MULTIPLIER = 0.1;
export const MAX_MOVEMENT_SPEED_MULTIPLIER = 20;

export type GameLevelRuntimeOverrides = {
    movementSpeedMultiplier: number;
};

export const isMovementSpeedMultiplierWithinBounds = (value: number) =>
    Number.isFinite(value) && value >= MIN_MOVEMENT_SPEED_MULTIPLIER && value <= MAX_MOVEMENT_SPEED_MULTIPLIER;

export const parseMovementSpeedMultiplier = (value: string | null) => {
    if (value === null) {
        return DEFAULT_MOVEMENT_SPEED_MULTIPLIER;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return DEFAULT_MOVEMENT_SPEED_MULTIPLIER;
    }

    return Math.min(MAX_MOVEMENT_SPEED_MULTIPLIER, Math.max(MIN_MOVEMENT_SPEED_MULTIPLIER, parsed));
};

export const parseGameLevelRuntimeOverrides = (requestUrl: string): GameLevelRuntimeOverrides => {
    const searchParams = new URL(requestUrl).searchParams;

    return {
        movementSpeedMultiplier: parseMovementSpeedMultiplier(searchParams.get('atharWalkSpeed')),
    };
};
