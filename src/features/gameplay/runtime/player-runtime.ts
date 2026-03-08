import { useSyncExternalStore } from 'react';

import type { Coords, MeterOffset } from '@/content/levels/types';
import { recordPlayerLocationWrite } from '@/features/debug/perf-metrics';
import type { SimulationPlayerState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { metersOffsetFromCoords } from '@/shared/geo';

export type PlayerRuntimeState = {
    bearing: number;
    coords: Coords;
    positionMeters: MeterOffset;
    speed: number;
};

const INITIAL_PLAYER_RUNTIME_STATE: PlayerRuntimeState = {
    bearing: 0,
    coords: { lat: 39.77, lng: 64.43 },
    positionMeters: { x: 0, z: 0 },
    speed: 0,
};

const listeners = new Set<() => void>();

let playerRuntimeState: PlayerRuntimeState = INITIAL_PLAYER_RUNTIME_STATE;
let playerRuntimeUpdatedAtMs = 0;

const getNowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const motionMatches = (left: PlayerRuntimeState, right: PlayerRuntimeState) =>
    left.bearing === right.bearing && left.speed === right.speed;

const locationMatches = (left: PlayerRuntimeState, right: PlayerRuntimeState) =>
    left.coords.lat === right.coords.lat &&
    left.coords.lng === right.coords.lng &&
    left.positionMeters.x === right.positionMeters.x &&
    left.positionMeters.z === right.positionMeters.z;

const statesMatch = (left: PlayerRuntimeState, right: PlayerRuntimeState) =>
    locationMatches(left, right) && motionMatches(left, right);

const emitChange = () => {
    for (const listener of listeners) {
        listener();
    }
};

const setPlayerRuntimeState = (nextState: PlayerRuntimeState) => {
    if (statesMatch(playerRuntimeState, nextState)) {
        return playerRuntimeState;
    }

    const locationChanged = !locationMatches(playerRuntimeState, nextState);
    const nowMs = getNowMs();
    playerRuntimeState = nextState;
    playerRuntimeUpdatedAtMs = nowMs;

    if (locationChanged) {
        recordPlayerLocationWrite();
    }

    emitChange();
    return playerRuntimeState;
};

export const getPlayerRuntimeState = () => playerRuntimeState;
export const getPlayerRuntimeUpdatedAtMs = () => playerRuntimeUpdatedAtMs;

export const subscribePlayerRuntimeState = (listener: () => void) => {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
};

export const usePlayerRuntimeState = () =>
    useSyncExternalStore(subscribePlayerRuntimeState, getPlayerRuntimeState, getPlayerRuntimeState);

export const usePlayerRuntimeBearing = () =>
    useSyncExternalStore(
        subscribePlayerRuntimeState,
        () => getPlayerRuntimeState().bearing,
        () => getPlayerRuntimeState().bearing,
    );

export const usePlayerRuntimeSpeed = () =>
    useSyncExternalStore(
        subscribePlayerRuntimeState,
        () => getPlayerRuntimeState().speed,
        () => getPlayerRuntimeState().speed,
    );

export const initializePlayerRuntimeState = (coords: Coords, origin: Coords) =>
    setPlayerRuntimeState({
        ...INITIAL_PLAYER_RUNTIME_STATE,
        coords,
        positionMeters: metersOffsetFromCoords(coords, origin),
    });

export const resetPlayerRuntimeState = () => {
    playerRuntimeState = INITIAL_PLAYER_RUNTIME_STATE;
    playerRuntimeUpdatedAtMs = 0;
    emitChange();
};

export const setPlayerRuntimeCoords = (coords: Coords, origin: Coords) =>
    setPlayerRuntimeState({
        ...playerRuntimeState,
        coords,
        positionMeters: metersOffsetFromCoords(coords, origin),
    });

export const setPlayerRuntimeLocation = (coords: Coords, positionMeters: MeterOffset) =>
    setPlayerRuntimeState({
        ...playerRuntimeState,
        coords,
        positionMeters,
    });

export const setPlayerRuntimeMotion = (bearing: number, speed: number) =>
    setPlayerRuntimeState({
        ...playerRuntimeState,
        bearing,
        speed,
    });

export const updatePlayerRuntimeMovement = ({ bearing, coords, positionMeters, speed }: PlayerRuntimeState) =>
    setPlayerRuntimeState({
        bearing,
        coords,
        positionMeters,
        speed,
    });

export const syncPlayerRuntimeFromSimulation = (
    player: Pick<SimulationPlayerState, 'bearing' | 'coords' | 'positionMeters' | 'speed'>,
) =>
    setPlayerRuntimeState({
        bearing: player.bearing,
        coords: player.coords,
        positionMeters: player.positionMeters,
        speed: player.speed,
    });
