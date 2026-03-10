import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { AudioCue } from '@/content/audio/cues';
import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { audioManager } from '@/features/audio/audio-manager';
import { atharDebugLog, isAtharDebugEnabled } from '@/features/debug/debug';
import { recordFrameDeltaMs, recordPlayerMovementTick } from '@/features/debug/perf-metrics';
import { getActiveSpikeWatch } from '@/features/debug/spike-watch';
import { clearInputState, getMovementInputSnapshot } from '@/features/gameplay/controllers/input-state';
import { sceneRegistry } from '@/features/gameplay/presentation/SceneRegistry';
import { commitSimulationSample, getAuthoritativePlayerSample } from '@/features/gameplay/runtime/simulation-bridge';
import { resetSimulationNowMs, setSimulationNowMs } from '@/features/gameplay/runtime/simulation-clock';
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
import { shouldPlayTeacherEncounterAudio } from '@/features/gameplay/systems/game-loop-audio';
import {
    type ObstacleDiagnostic,
    resolveObstacleDiagnostic,
} from '@/features/gameplay/systems/game-loop-obstacle-diagnostics';
import { advanceSimulationNowMs, getSimulationCharacterModifiers } from '@/features/gameplay/systems/game-loop-runtime';
import { resolveEncounterFeedback } from '@/features/hud/lib/encounter-feedback';

const PLAYER_ENTITY_ID = 'player';
const GAME_LOOP_SPIKE_THRESHOLD_MS = 25;
const WATCHED_GAME_LOOP_SPIKE_THRESHOLD_MS = 22;
const FOOTSTEP_AUDIO_CUE: AudioCue = 'footsteps-walk';
const TEACHER_ENCOUNTER_AUDIO_CUE: AudioCue = 'teacher-encounter';
const OBSTACLE_DIAGNOSTIC_SAMPLE_INTERVAL_MS = 120;

const syncFootstepLoop = (active: boolean) => {
    audioManager.setLoopActive(FOOTSTEP_AUDIO_CUE, active);
};

const shouldPlayFootsteps = (state: Pick<SimulationPlayerState, 'dialogueOpen' | 'speed'>, levelComplete: boolean) =>
    state.speed > 0 && !state.dialogueOpen && !levelComplete;

type ObstacleDiagnosticLogState = Pick<ObstacleDiagnostic, 'obstacleId' | 'signature'>;

const logObstacleDiagnostics = (
    state: SimulationState,
    lastDiagnosticRef: { current: ObstacleDiagnosticLogState | null },
    lastDiagnosticCheckAtMsRef: { current: number },
) => {
    if (!isAtharDebugEnabled()) {
        return;
    }

    if (state.nowMs - lastDiagnosticCheckAtMsRef.current < OBSTACLE_DIAGNOSTIC_SAMPLE_INTERVAL_MS) {
        return;
    }

    lastDiagnosticCheckAtMsRef.current = state.nowMs;
    const diagnostic = resolveObstacleDiagnostic(state);

    if (!diagnostic) {
        if (lastDiagnosticRef.current) {
            atharDebugLog('route', 'OBSTACLE_LEFT_ZONE', {
                obstacleId: lastDiagnosticRef.current.obstacleId,
            });
            lastDiagnosticRef.current = null;
        }

        return;
    }

    if (lastDiagnosticRef.current?.signature === diagnostic.signature) {
        return;
    }

    lastDiagnosticRef.current = {
        obstacleId: diagnostic.obstacleId,
        signature: diagnostic.signature,
    };
    atharDebugLog('route', diagnostic.eventName, {
        distanceFromTriggerMeters: diagnostic.distanceFromTriggerMeters,
        distanceMeters: diagnostic.distanceMeters,
        effect: diagnostic.effect,
        hadithTokens: diagnostic.hadithTokens,
        obstacleBaseCoords: diagnostic.obstacleBaseCoords,
        obstacleCoords: diagnostic.obstacleCoords,
        obstacleId: diagnostic.obstacleId,
        obstacleLabel: diagnostic.obstacleLabel,
        obstacleType: diagnostic.obstacleType,
        onCooldown: diagnostic.onCooldown,
        playerCoords: diagnostic.playerCoords,
        safeZoneSuppressed: diagnostic.safeZoneSuppressed,
        suppressionReason: diagnostic.suppressionReason,
        triggerRadiusMeters: diagnostic.triggerRadiusMeters,
        withinTriggerRadius: diagnostic.withinTriggerRadius,
    });
};

const logFrameTiming = (nowMs: number, frameDeltaMs: number) => {
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
};

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

const readSimulationState = (movementSpeedMultiplier: number, nowMs: number): SimulationState | null => {
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
        nowMs,
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

        if (event.type === 'hazard-triggered') {
            useGameplaySessionStore.getState().showEncounterFeedback(resolveEncounterFeedback(event));
        }

        if (event.type === 'player-defeated') {
            clearInputState();
            useGameplaySessionStore.getState().showDefeat({
                detail: `The ${event.obstacleLabel.toLowerCase()} closed the route before you could escape.`,
                title: event.obstacleLabel,
            });
            syncFootstepLoop(false);
        }
    }
};

type GameLoopProps = {
    movementSpeedMultiplier?: number;
};

export const GameLoop = ({ movementSpeedMultiplier = 1 }: GameLoopProps) => {
    const levelId = useLevelStore((state) => state.config?.id);
    const paused = useGameplaySessionStore((state) => state.paused);
    const runnerRef = useRef<SimulationRunner>(createSimulationRunner());
    const lastFrameAtMsRef = useRef(performance.now());
    const obstacleDiagnosticRef = useRef<ObstacleDiagnosticLogState | null>(null);
    const obstacleDiagnosticCheckAtMsRef = useRef(0);
    const simulationNowMsRef = useRef(0);

    useEffect(() => {
        const initialNowMs = Date.now();
        runnerRef.current.reset(initialNowMs);
        lastFrameAtMsRef.current = performance.now();
        simulationNowMsRef.current = initialNowMs;
        setSimulationNowMs(initialNowMs);
        obstacleDiagnosticCheckAtMsRef.current = 0;

        return () => {
            syncFootstepLoop(false);
            resetSimulationNowMs();
        };
    }, [levelId]);

    useFrame(() => {
        if (!levelId || paused) {
            syncFootstepLoop(false);
            if (paused) {
                lastFrameAtMsRef.current = performance.now();
            }
            return;
        }

        const nowMs = performance.now();
        const frameDeltaMs = Math.min(Math.max(nowMs - lastFrameAtMsRef.current, 0), 100);
        lastFrameAtMsRef.current = nowMs;
        simulationNowMsRef.current = advanceSimulationNowMs(simulationNowMsRef.current, frameDeltaMs);
        setSimulationNowMs(simulationNowMsRef.current);
        logFrameTiming(nowMs, frameDeltaMs);

        const state = readSimulationState(movementSpeedMultiplier, simulationNowMsRef.current);
        if (!state || state.levelState.isComplete) {
            syncFootstepLoop(false);
            return;
        }

        logObstacleDiagnostics(state, obstacleDiagnosticRef, obstacleDiagnosticCheckAtMsRef);

        const result = runnerRef.current.advance({
            frameDeltaMs,
            input: getMovementInputSnapshot(),
            state,
        });

        if (!result.didStep) {
            syncFootstepLoop(shouldPlayFootsteps(state.player, false));
            return;
        }

        syncFootstepLoop(shouldPlayFootsteps(result.state.player, result.state.levelState.isComplete));

        if (shouldPlayTeacherEncounterAudio(state.player, result.state.player)) {
            audioManager.play(TEACHER_ENCOUNTER_AUDIO_CUE);
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
