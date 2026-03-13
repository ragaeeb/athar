import { create } from 'zustand';

import type { Coords, MeterOffset, TeacherConfig, TokenState } from '@/content/levels/types';
import {
    getPlayerRuntimeState,
    initializePlayerRuntimeState,
    resetPlayerRuntimeState,
    setPlayerRuntimeCoords,
    setPlayerRuntimeLocation,
    setPlayerRuntimeMotion,
    updatePlayerRuntimeMovement,
} from '@/features/gameplay/runtime/player-runtime';
import { initializeSimulationBridge, resetSimulationBridge } from '@/features/gameplay/runtime/simulation-bridge';
import type { SimulationPlayerState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { PLAYER_RUN_MAX_CHARGE_MS } from '@/shared/constants/gameplay';
import { metersOffsetFromCoords } from '@/shared/geo';

export type PlayerState = {
    hadithTokens: number;
    isHit: boolean;
    isRunning: boolean;
    hitTokens: TokenState[];
    activeTeacher: TeacherConfig | null;
    dialogueOpen: boolean;
    scrambleUntil: number;
    runChargeMs: number;
    lastHitAt: number;
    tokensLost: number;
    startedAt: number;
    setCoords: (coords: Coords, origin: Coords) => void;
    setLocation: (coords: Coords, positionMeters: MeterOffset) => void;
    updateMovement: (movement: { coords: Coords; positionMeters: MeterOffset; bearing: number; speed: number }) => void;
    setBearingAndSpeed: (bearing: number, speed: number) => void;
    addToken: (count?: number) => void;
    loseTokens: (count: number, scatteredTokens: TokenState[], hitAt: number) => void;
    bankTokens: () => number;
    openDialogue: (teacher: TeacherConfig) => void;
    closeDialogue: () => void;
    setScramble: (until: number, hitAt?: number) => void;
    clearExpiredHitTokens: (now: number) => void;
    initializePlayer: (coords: Coords, origin: Coords) => void;
    syncFromSimulation: (player: SimulationPlayerState) => void;
};

const initialPlayerState = {
    activeTeacher: null,
    dialogueOpen: false,
    hadithTokens: 0,
    hitTokens: [] as TokenState[],
    isHit: false,
    isRunning: false,
    lastHitAt: 0,
    runChargeMs: PLAYER_RUN_MAX_CHARGE_MS,
    scrambleUntil: 0,
    startedAt: Date.now(),
    tokensLost: 0,
};

export const usePlayerStore = create<PlayerState>()((set, get) => ({
    ...initialPlayerState,
    addToken: (count = 1) =>
        set((state) => ({
            hadithTokens: state.hadithTokens + count,
        })),
    bankTokens: (): number => {
        const current = get().hadithTokens;
        set({
            hadithTokens: 0,
            hitTokens: [],
            isHit: false,
        });
        return current;
    },
    clearExpiredHitTokens: (now) =>
        set((state) => {
            if (state.hitTokens.length === 0) {
                return state;
            }

            const activeTokens = state.hitTokens.filter((token) => !token.expiresAt || token.expiresAt > now);
            const nextIsHit = activeTokens.length > 0;

            if (activeTokens.length === state.hitTokens.length && state.isHit === nextIsHit) {
                return state;
            }

            return {
                hitTokens: activeTokens,
                isHit: nextIsHit,
            };
        }),
    closeDialogue: () => set({ activeTeacher: null, dialogueOpen: false }),
    initializePlayer: (coords, origin) => {
        initializePlayerRuntimeState(coords, origin);
        initializeSimulationBridge({
            bearing: 0,
            coords,
            positionMeters: metersOffsetFromCoords(coords, origin),
            speed: 0,
        });
        set({
            ...initialPlayerState,
            startedAt: Date.now(),
        });
    },
    loseTokens: (count, scatteredTokens, hitAt) =>
        set((state) => ({
            hadithTokens: Math.max(state.hadithTokens - count, 0),
            hitTokens: scatteredTokens,
            isHit: count > 0,
            lastHitAt: hitAt,
            tokensLost: state.tokensLost + count,
        })),
    openDialogue: (teacher) => {
        setPlayerRuntimeMotion(getPlayerRuntimeState().bearing, 0);
        set({ activeTeacher: teacher, dialogueOpen: true });
    },
    setBearingAndSpeed: (bearing, speed) => {
        setPlayerRuntimeMotion(bearing, speed);
    },
    setCoords: (coords, origin) => {
        setPlayerRuntimeCoords(coords, origin);
    },
    setLocation: (coords, positionMeters) => {
        setPlayerRuntimeLocation(coords, positionMeters);
    },
    setScramble: (until, hitAt) =>
        set((state) => {
            if (state.scrambleUntil === until && (hitAt === undefined || state.lastHitAt === hitAt)) {
                return state;
            }

            return {
                lastHitAt: hitAt ?? state.lastHitAt,
                scrambleUntil: until,
            };
        }),
    syncFromSimulation: (player) => {
        set((state) => {
            const runtimeUnchanged =
                state.activeTeacher === player.activeTeacher &&
                state.dialogueOpen === player.dialogueOpen &&
                state.hadithTokens === player.hadithTokens &&
                state.hitTokens === player.hitTokens &&
                state.isHit === player.isHit &&
                state.isRunning === player.isRunning &&
                state.lastHitAt === player.lastHitAt &&
                state.runChargeMs === player.runChargeMs &&
                state.scrambleUntil === player.scrambleUntil &&
                state.tokensLost === player.tokensLost;

            if (runtimeUnchanged) {
                return state;
            }

            return {
                activeTeacher: player.activeTeacher,
                dialogueOpen: player.dialogueOpen,
                hadithTokens: player.hadithTokens,
                hitTokens: player.hitTokens,
                isHit: player.isHit,
                isRunning: player.isRunning,
                lastHitAt: player.lastHitAt,
                runChargeMs: player.runChargeMs,
                scrambleUntil: player.scrambleUntil,
                tokensLost: player.tokensLost,
            };
        });
    },
    updateMovement: ({ coords, positionMeters, bearing, speed }) => {
        updatePlayerRuntimeMovement({
            bearing,
            coords,
            positionMeters,
            speed,
        });
    },
}));

export const resetPlayerStore = () => {
    resetPlayerRuntimeState();
    resetSimulationBridge();
    usePlayerStore.setState({
        ...initialPlayerState,
        startedAt: Date.now(),
    });
};
