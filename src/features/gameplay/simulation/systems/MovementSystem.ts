import type {
    SimulationEvent,
    SimulationInputState,
    SimulationPlayerState,
    SimulationState,
} from '@/features/gameplay/simulation/core/SimulationTypes';
import { resolveMovementStep } from '@/features/gameplay/systems/player-motion';
import { BASE_PLAYER_SPEED_METERS_PER_SECOND } from '@/shared/constants/gameplay';

const withStoppedPlayer = (player: SimulationPlayerState): SimulationPlayerState =>
    player.speed === 0
        ? player
        : {
              ...player,
              speed: 0,
          };

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
            player: withStoppedPlayer(state.player),
        };
    }

    const speed = BASE_PLAYER_SPEED_METERS_PER_SECOND * state.character.speedMultiplier;
    const movement = resolveMovementStep({
        delta: deltaMs / 1_000,
        moveX: input.moveX,
        moveZ: input.moveZ,
        origin: state.level.origin,
        positionMeters: state.player.positionMeters,
        scrambleMultiplier: 1,
        speed,
    });

    return {
        events: [{ type: 'player-moved' }],
        player: {
            ...state.player,
            bearing: movement.bearing,
            coords: movement.nextCoords,
            positionMeters: movement.nextPositionMeters,
            speed,
        },
    };
};
