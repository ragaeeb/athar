import type {
    SimulationEvent,
    SimulationInputState,
    SimulationPlayerState,
    SimulationState,
} from '@/features/gameplay/simulation/core/SimulationTypes';
import { resolveMovementStep } from '@/features/gameplay/simulation/systems/movement-utils';
import {
    BASE_PLAYER_SPEED_METERS_PER_SECOND,
    PLAYER_RUN_MAX_CHARGE_MS,
    PLAYER_RUN_MIN_START_CHARGE_FRACTION,
    PLAYER_RUN_RECHARGE_MS,
    PLAYER_RUN_SPEED_MULTIPLIER,
} from '@/shared/constants/gameplay';

const withStoppedPlayer = (player: SimulationPlayerState): SimulationPlayerState =>
    player.speed === 0 && !player.isRunning
        ? player
        : {
              ...player,
              isRunning: false,
              speed: 0,
          };

const clampRunChargeMs = (runChargeMs: number) => Math.max(0, Math.min(PLAYER_RUN_MAX_CHARGE_MS, runChargeMs));

const rechargeRunChargeMs = (runChargeMs: number, deltaMs: number) =>
    clampRunChargeMs(runChargeMs + deltaMs * (PLAYER_RUN_MAX_CHARGE_MS / PLAYER_RUN_RECHARGE_MS));

const MIN_RUN_REENGAGE_CHARGE_MS = PLAYER_RUN_MAX_CHARGE_MS * PLAYER_RUN_MIN_START_CHARGE_FRACTION;

export const applyMovementStep = (
    state: SimulationState,
    input: SimulationInputState,
    deltaMs: number,
): { events: SimulationEvent[]; player: SimulationPlayerState } => {
    if (state.levelState.isComplete || state.player.dialogueOpen) {
        return {
            events: [],
            player: withStoppedPlayer(state.player),
        };
    }

    if (input.moveX === 0 && input.moveZ === 0) {
        return {
            events: [],
            player: {
                ...withStoppedPlayer(state.player),
                runChargeMs: rechargeRunChargeMs(state.player.runChargeMs, deltaMs),
            },
        };
    }

    const walkSpeed = BASE_PLAYER_SPEED_METERS_PER_SECOND * state.character.speedMultiplier;
    const canRun =
        input.runRequested &&
        (state.player.isRunning
            ? state.player.runChargeMs > 0
            : state.player.runChargeMs >= MIN_RUN_REENGAGE_CHARGE_MS);
    const speed = canRun ? walkSpeed * PLAYER_RUN_SPEED_MULTIPLIER : walkSpeed;
    const movement = resolveMovementStep({
        delta: deltaMs / 1_000,
        moveX: input.moveX,
        moveZ: input.moveZ,
        origin: state.level.origin,
        positionMeters: state.player.positionMeters,
        scrambleMultiplier: state.player.scrambleUntil > state.nowMs ? -1 : 1,
        speed,
    });

    return {
        events: [{ type: 'player-moved' }],
        player: {
            ...state.player,
            bearing: movement.bearing,
            coords: movement.nextCoords,
            isRunning: canRun,
            positionMeters: movement.nextPositionMeters,
            runChargeMs: canRun
                ? clampRunChargeMs(state.player.runChargeMs - deltaMs)
                : rechargeRunChargeMs(state.player.runChargeMs, deltaMs),
            speed,
        },
    };
};
