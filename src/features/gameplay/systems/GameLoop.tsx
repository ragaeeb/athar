import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { audioManager } from '@/features/audio/audio-manager';
import { recordFrameDeltaMs, recordPlayerMovementTick } from '@/features/debug/perf-metrics';
import { getMovementInputSnapshot } from '@/features/gameplay/controllers/input-state';
import { rendererBridge } from '@/features/gameplay/presentation/PresentationRuntime';
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

const readSimulationPlayerState = (): SimulationPlayerState => {
    const playerState = usePlayerStore.getState();

    return {
        activeTeacher: playerState.activeTeacher,
        bearing: playerState.bearing,
        coords: playerState.coords,
        dialogueOpen: playerState.dialogueOpen,
        hadithTokens: playerState.hadithTokens,
        hitTokens: playerState.hitTokens,
        isHit: playerState.isHit,
        lastHitAt: playerState.lastHitAt,
        positionMeters: playerState.positionMeters,
        scrambleUntil: playerState.scrambleUntil,
        speed: playerState.speed,
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

const readSimulationState = (): SimulationState | null => {
    const levelState = useLevelStore.getState();
    if (!levelState.config) {
        return null;
    }

    const selectedCharacter = useGameStore.getState().selectedCharacter;
    const characterConfig = CHARACTER_CONFIGS[selectedCharacter];

    return {
        character: {
            obstacleDamageMultiplier: characterConfig.obstacleDamageMultiplier,
            speedMultiplier: characterConfig.speedMultiplier,
            tokenRadiusMultiplier: characterConfig.tokenRadiusMultiplier,
        },
        level: levelState.config,
        levelState: readSimulationLevelState(),
        nowMs: Date.now(),
        player: readSimulationPlayerState(),
    };
};

const applySimulationEvents = (events: SimulationEvent[]) => {
    for (const event of events) {
        if (event.type === 'audio') {
            audioManager.play(event.cue);
        }

        if (event.type === 'player-moved') {
            recordPlayerMovementTick();
        }
    }
};

export const GameLoop = () => {
    const levelId = useLevelStore((state) => state.config?.id);
    const runnerRef = useRef<SimulationRunner>(createSimulationRunner());

    useEffect(() => {
        runnerRef.current.reset(Date.now());
    }, [levelId]);

    useFrame((_, rawDelta) => {
        const frameDeltaMs = Math.min(rawDelta, 0.1) * 1_000;
        recordFrameDeltaMs(frameDeltaMs);

        const state = readSimulationState();
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

        usePlayerStore.getState().syncFromSimulation(result.state.player);
        useLevelStore.getState().syncFromSimulation(result.state.levelState);
        rendererBridge.consume(result);
        applySimulationEvents(result.events);
    });

    return null;
};
