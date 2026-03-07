import { create } from 'zustand';

import type { Coords, MeterOffset, TeacherConfig, TokenState } from '@/content/levels/types';
import { atharDebugLog } from '@/features/debug/debug';
import { recordPlayerLocationWrite } from '@/features/debug/perf-metrics';
import { metersOffsetFromCoords } from '@/features/map/lib/geo';

export type PlayerState = {
    coords: Coords;
    positionMeters: MeterOffset;
    bearing: number;
    speed: number;
    hadithTokens: number;
    isHit: boolean;
    hitTokens: TokenState[];
    activeTeacher: TeacherConfig | null;
    dialogueOpen: boolean;
    scrambleUntil: number;
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
};

const initialPlayerState = {
    activeTeacher: null,
    bearing: 0,
    coords: { lat: 39.77, lng: 64.43 },
    dialogueOpen: false,
    hadithTokens: 0,
    hitTokens: [] as TokenState[],
    isHit: false,
    lastHitAt: 0,
    positionMeters: { x: 0, z: 0 },
    scrambleUntil: 0,
    speed: 0,
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
    initializePlayer: (coords, origin) =>
        set({
            ...initialPlayerState,
            coords,
            positionMeters: metersOffsetFromCoords(coords, origin),
            startedAt: Date.now(),
        }),
    loseTokens: (count, scatteredTokens, hitAt) =>
        set((state) => ({
            hadithTokens: Math.max(state.hadithTokens - count, 0),
            hitTokens: scatteredTokens,
            isHit: count > 0,
            lastHitAt: hitAt,
            tokensLost: state.tokensLost + count,
        })),
    openDialogue: (teacher) => set({ activeTeacher: teacher, dialogueOpen: true, speed: 0 }),
    setBearingAndSpeed: (bearing, speed) =>
        set((state) => {
            if (state.bearing === bearing && state.speed === speed) {
                return state;
            }

            atharDebugLog('store', 'player:setBearingAndSpeed', { bearing, speed }, { throttleMs: 120 });

            return { bearing, speed };
        }),
    setCoords: (coords, origin) =>
        set((state) => {
            const nextPositionMeters = metersOffsetFromCoords(coords, origin);

            if (
                state.coords.lat === coords.lat &&
                state.coords.lng === coords.lng &&
                state.positionMeters.x === nextPositionMeters.x &&
                state.positionMeters.z === nextPositionMeters.z
            ) {
                return state;
            }

            atharDebugLog(
                'store',
                'player:setCoords',
                {
                    coords,
                    positionMeters: nextPositionMeters,
                },
                { throttleMs: 120 },
            );
            recordPlayerLocationWrite();

            return {
                coords,
                positionMeters: nextPositionMeters,
            };
        }),
    setLocation: (coords, positionMeters) =>
        set((state) => {
            if (
                state.coords.lat === coords.lat &&
                state.coords.lng === coords.lng &&
                state.positionMeters.x === positionMeters.x &&
                state.positionMeters.z === positionMeters.z
            ) {
                return state;
            }

            atharDebugLog(
                'store',
                'player:setLocation',
                {
                    coords,
                    positionMeters,
                },
                { throttleMs: 120 },
            );
            recordPlayerLocationWrite();

            return {
                coords,
                positionMeters,
            };
        }),
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
    updateMovement: ({ coords, positionMeters, bearing, speed }) =>
        set((state) => {
            const locationUnchanged =
                state.coords.lat === coords.lat &&
                state.coords.lng === coords.lng &&
                state.positionMeters.x === positionMeters.x &&
                state.positionMeters.z === positionMeters.z;
            const motionUnchanged = state.bearing === bearing && state.speed === speed;

            if (locationUnchanged && motionUnchanged) {
                return state;
            }

            atharDebugLog(
                'store',
                'player:updateMovement',
                {
                    bearing,
                    coords,
                    positionMeters,
                    speed,
                },
                { throttleMs: 120 },
            );

            if (!locationUnchanged) {
                recordPlayerLocationWrite();
            }

            return {
                bearing,
                coords,
                positionMeters,
                speed,
            };
        }),
}));

export const resetPlayerStore = () => {
    usePlayerStore.setState({
        ...initialPlayerState,
        startedAt: Date.now(),
    });
};
