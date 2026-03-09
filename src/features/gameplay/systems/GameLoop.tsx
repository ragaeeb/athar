import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { AudioCue } from '@/content/audio/cues';
import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { audioManager } from '@/features/audio/audio-manager';
import { atharDebugLog } from '@/features/debug/debug';
import { recordFrameDeltaMs, recordPlayerMovementTick } from '@/features/debug/perf-metrics';
import { getActiveSpikeWatch } from '@/features/debug/spike-watch';
import { getMovementInputSnapshot } from '@/features/gameplay/controllers/input-state';
import { sceneRegistry } from '@/features/gameplay/presentation/SceneRegistry';
import { commitSimulationSample, getAuthoritativePlayerSample } from '@/features/gameplay/runtime/simulation-bridge';
import { createSimulationRunner, type SimulationRunner } from '@/features/gameplay/simulation/core/SimulationRunner';
import type {
    SimulationEvent,
    SimulationLevelState,
    SimulationPlayerState,
    SimulationState,
} from '@/features/gameplay/simulation/core/SimulationTypes';
import { useGameStore } from '@/features/gameplay/state/game.store';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { useGameplaySessionStore } from '@/features/gameplay/state/session.store';
import { getSimulationCharacterModifiers } from '@/features/gameplay/systems/game-loop-runtime';

const PLAYER_ENTITY_ID = 'player';
const GAME_LOOP_SPIKE_THRESHOLD_MS = 25;
const WATCHED_GAME_LOOP_SPIKE_THRESHOLD_MS = 22;

const readSimulationPlayerState = (): SimulationPlayerState => {
    const playerState = usePlayerStore.getState();
    const authoritativeMotion = getAuthoritativePlayerSample();

    return {
        activeTeacher: playerState.activeTeacher,
        bearing: authoritativeMotion?.bearing ?? 0,
        coords: authoritativeMotion?.coords ?? { lat: 0, lng: 0 },
        dialogueOpen: playerState.dialogueOpen,
        hadithTokens: playerState.hadithTokens,
        hitTokens: playerState.hitTokens,
        isHit: playerState.isHit,
        lastHitAt: playerState.lastHitAt,
        positionMeters: authoritativeMotion?.positionMeters ?? { x: 0, z: 0 },
        scrambleUntil: playerState.scrambleUntil,
        speed: authoritativeMotion?.speed ?? 0,
        tokensLost: playerState.tokensLost,
    };
};

const readSimulationLevelState = (): SimulationLevelState => {
    const levelState = useLevelStore.getState();

    return {
        completedMilestoneIds: levelState.completedMilestoneIds,
        completedTeacherIds: levelState.completedTeacherIds,
        isComplete: levelState.isComplete,
        lockedHadith: levelState.lockedHadith,
        nextObjective: levelState.nextObjective,
        objectives: levelState.objectives,
        tokens: levelState.tokens,
    };
};

const readSimulationState = (movementSpeedMultiplier: number): SimulationState | null => {
    const levelState = useLevelStore.getState();
    if (!levelState.config) {
        return null;
    }

    const selectedCharacter = useGameStore.getState().selectedCharacter;
    const characterConfig = CHARACTER_CONFIGS[selectedCharacter];

    return {
        character: getSimulationCharacterModifiers(characterConfig, movementSpeedMultiplier),
        level: levelState.config,
        levelState: readSimulationLevelState(),
        nowMs: Date.now(),
        player: readSimulationPlayerState(),
    };
};

const applySimulationEvents = (events: SimulationEvent[]) => {
    const playedAudioCues = new Set<AudioCue>();

    for (const event of events) {
        if (event.type === 'audio') {
            if (playedAudioCues.has(event.cue)) {
                continue;
            }

            playedAudioCues.add(event.cue);
            audioManager.play(event.cue);
        }

        if (event.type === 'player-moved') {
            recordPlayerMovementTick();
        }
    }
};

type GameLoopProps = {
    movementSpeedMultiplier?: number;
};

export const GameLoop = ({ movementSpeedMultiplier = 1 }: GameLoopProps) => {
    const levelId = useLevelStore((state) => state.config?.id);
    const paused = useGameplaySessionStore((state) => state.paused);
    const runnerRef = useRef<SimulationRunner>(createSimulationRunner({ variableTimestep: true }));
    const lastFrameAtMsRef = useRef(performance.now());

    useEffect(() => {
        runnerRef.current.reset(Date.now());
        lastFrameAtMsRef.current = performance.now();
    }, [levelId]);

    useFrame(() => {
        if (!levelId) {
            return;
        }

        if (paused) {
            lastFrameAtMsRef.current = performance.now();
            return;
        }

        const nowMs = performance.now();
        const frameDeltaMs = Math.min(Math.max(nowMs - lastFrameAtMsRef.current, 0), 100);
        lastFrameAtMsRef.current = nowMs;

        recordFrameDeltaMs(frameDeltaMs);
        if (frameDeltaMs > GAME_LOOP_SPIKE_THRESHOLD_MS) {
            atharDebugLog('route', 'GAME_LOOP_SPIKE', { frameDeltaMs });
        }

        const activeSpikeWatch = getActiveSpikeWatch();
        if (activeSpikeWatch && frameDeltaMs > WATCHED_GAME_LOOP_SPIKE_THRESHOLD_MS) {
            atharDebugLog(
                'route',
                'WATCHED_GAME_LOOP_SPIKE',
                {
                    frameDeltaMs,
                    watchLabel: activeSpikeWatch.label,
                    watchOffsetMs: nowMs - activeSpikeWatch.startedAtMs,
                },
                { throttleKey: `watched-game-loop-spike:${activeSpikeWatch.label}`, throttleMs: 250 },
            );
        }

        const state = readSimulationState(movementSpeedMultiplier);
        if (!state || state.levelState.isComplete) {
            return;
        }

        const result = runnerRef.current.advance({
            frameDeltaMs,
            input: getMovementInputSnapshot(),
            state,
        });

        if (!result.didStep) {
            return;
        }

        commitSimulationSample({
            bearing: result.state.player.bearing,
            coords: result.state.player.coords,
            positionMeters: result.state.player.positionMeters,
            speed: result.state.player.speed,
        });
        sceneRegistry.markDirty(PLAYER_ENTITY_ID);
        usePlayerStore.getState().syncFromSimulation(result.state.player);
        useLevelStore.getState().syncFromSimulation(result.state.levelState);
        applySimulationEvents(result.events);
    }, -1);

    return null;
};
