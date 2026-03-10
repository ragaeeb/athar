import type { Coords, MeterOffset } from '@/content/levels/types';

export type PlayerSample = {
    bearing: number;
    coords: Coords;
    positionMeters: MeterOffset;
    speed: number;
};

type BridgeState = {
    current: PlayerSample | null;
    sequence: number;
};

let bridge: BridgeState = {
    current: null,
    sequence: 0,
};

export const commitSimulationSample = (sample: PlayerSample): void => {
    bridge = {
        current: sample,
        sequence: bridge.sequence + 1,
    };
};

export const getAuthoritativePlayerSample = (): PlayerSample | null => bridge.current;

export type InterpolatedPlayerState = PlayerSample & { interpolated: boolean };

export const drainForPresentation = (
    lastRenderedSequence: number,
): { sequence: number; state: InterpolatedPlayerState } | null => {
    const { current, sequence } = bridge;
    if (!current || sequence <= lastRenderedSequence) {
        return null;
    }

    return {
        sequence,
        state: {
            bearing: current.bearing,
            coords: current.coords,
            interpolated: false,
            positionMeters: current.positionMeters,
            speed: current.speed,
        },
    };
};

export const initializeSimulationBridge = (sample: PlayerSample): void => {
    bridge = {
        current: sample,
        sequence: 1,
    };
};

export const resetSimulationBridge = (): void => {
    bridge = {
        current: null,
        sequence: 0,
    };
};
