import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-three-map/maplibre';
import { Vector3 } from 'three';

import type { Coords } from '@/content/levels/types';
import { atharDebugLog, isAtharDebugEnabled } from '@/features/debug/debug';
import {
    type MotionDiagnosticEvent,
    recordMotionDiagnosticFrame,
    resetMotionDiagnostics,
} from '@/features/debug/motion-diagnostics';
import {
    clearManualCameraOverride,
    getLastManualMapInteractionAt,
    isManualCameraOverrideActive,
    recordCameraFollow,
    recordCameraFollowCooldownSkip,
} from '@/features/debug/perf-metrics';
import { getActiveSpikeWatch } from '@/features/debug/spike-watch';
import { coordsToPlayerLocalPosition } from '@/features/gameplay/presentation/player-local-position';
import {
    buildPresentationMotionFrame,
    type PresentationMotionState,
    resolvePresentationCameraFollowDecision,
} from '@/features/gameplay/presentation/presentation-frame';
import { sceneRegistry } from '@/features/gameplay/presentation/SceneRegistry';
import { updatePlayerRuntimeMovement } from '@/features/gameplay/runtime/player-runtime';
import { drainForPresentation } from '@/features/gameplay/runtime/simulation-bridge';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { resolveScreenSpaceFollowCorrection, shouldAutoFollowCamera } from '@/features/gameplay/systems/player-motion';

const PLAYER_ENTITY_ID = 'player';
const CAMERA_FOLLOW_EASE_DURATION_MS = 180;
const CAMERA_FOLLOW_MIN_CORRECTION_PX = 12;
const CAMERA_FOLLOW_SCREEN_DEADZONE_X = 0.38;
const CAMERA_FOLLOW_SCREEN_DEADZONE_Y = 0.28;
const MANUAL_CAMERA_INTERACTION_COOLDOWN_MS = 900;
const FPS_DROP_THRESHOLD = 50;
const FPS_RECOVERY_THRESHOLD = 57;
const FPS_SAMPLE_WINDOW = 20;
const FPS_SUSTAINED_DROP_FRAMES = 8;
const WATCHED_PRESENTATION_FRAME_SPIKE_THRESHOLD_MS = 22;
const WATCHED_JUMP_TO_SPIKE_THRESHOLD_MS = 3;

type PresentationRuntimeProps = {
    origin: Coords;
};

const readStaticCameraMode = () =>
    typeof window !== 'undefined' && new URL(window.location.href).searchParams.has('staticCamera');

const buildMotionDiagnosticPayload = ({ summary, type }: MotionDiagnosticEvent) => ({
    avgCameraCenterVelocityMps: summary.avgCameraCenterVelocityMps,
    avgCameraCommitVelocityMps: summary.avgCameraCommitVelocityMps,
    avgFrameDeltaMs: summary.avgFrameDeltaMs,
    avgJumpToDurationMs: summary.avgJumpToDurationMs,
    avgLocalVelocityMps: summary.avgLocalVelocityMps,
    avgScreenOffsetPx: summary.avgScreenOffsetPx,
    avgScreenVelocityPxPerSecond: summary.avgScreenVelocityPxPerSecond,
    avgWorldVelocityMps: summary.avgWorldVelocityMps,
    cameraCenterVelocityCv: summary.cameraCenterVelocityCv,
    cameraCommitCount: summary.cameraCommitCount,
    cameraCommitVelocityCv: summary.cameraCommitVelocityCv,
    frameCount: summary.frameCount,
    likelySource: summary.likelySource,
    localVelocityCv: summary.localVelocityCv,
    longFrameCount: summary.longFrameCount,
    maxJumpToDurationMs: summary.maxJumpToDurationMs,
    p95FrameDeltaMs: summary.p95FrameDeltaMs,
    screenOffsetCv: summary.screenOffsetCv,
    screenVelocityCv: summary.screenVelocityCv,
    sequenceRepeatCount: summary.sequenceRepeatCount,
    severity: summary.severity,
    type,
    worldVelocityCv: summary.worldVelocityCv,
});

const reportMotionDiagnosticEvents = (events: MotionDiagnosticEvent[]) => {
    for (const event of events) {
        atharDebugLog('motion', event.type, buildMotionDiagnosticPayload(event));
    }
};

const pushFpsSample = (samples: number[], fps: number) => {
    samples.push(fps);
    if (samples.length > FPS_SAMPLE_WINDOW) {
        samples.shift();
    }

    return samples.reduce((total, sample) => total + sample, 0) / Math.max(1, samples.length);
};

const reportRenderFpsState = ({
    averageFps,
    dropActiveRef,
    dropFrameCountRef,
    fps,
    rawDeltaMs,
}: {
    averageFps: number;
    dropActiveRef: { current: boolean };
    dropFrameCountRef: { current: number };
    fps: number;
    rawDeltaMs: number;
}) => {
    if (averageFps < FPS_DROP_THRESHOLD) {
        dropFrameCountRef.current += 1;
        if (!dropActiveRef.current && dropFrameCountRef.current >= FPS_SUSTAINED_DROP_FRAMES) {
            dropActiveRef.current = true;
            atharDebugLog(
                'camera',
                'RENDER_FPS_DROP',
                {
                    averageFps,
                    fps,
                    rawDeltaMs,
                    slowFrameCount: dropFrameCountRef.current,
                },
                { throttleMs: 1_000 },
            );
        }

        return;
    }

    dropFrameCountRef.current = 0;
    if (dropActiveRef.current && averageFps >= FPS_RECOVERY_THRESHOLD) {
        dropActiveRef.current = false;
        atharDebugLog('camera', 'RENDER_FPS_RECOVERED', { averageFps, fps, rawDeltaMs }, { throttleMs: 500 });
    }
};

const reportFrameSpikes = ({
    activeSpikeWatch,
    averageFps,
    fps,
    rawDeltaMs,
}: {
    activeSpikeWatch: ReturnType<typeof getActiveSpikeWatch>;
    averageFps: number;
    fps: number;
    rawDeltaMs: number;
}) => {
    if (rawDeltaMs > 25) {
        atharDebugLog(
            'camera',
            'PRESENTATION_FRAME_SPIKE',
            {
                averageFps,
                fps,
                rawDeltaMs,
            },
            { throttleMs: 250 },
        );
    }

    if (activeSpikeWatch && rawDeltaMs > WATCHED_PRESENTATION_FRAME_SPIKE_THRESHOLD_MS) {
        atharDebugLog(
            'camera',
            'WATCHED_PRESENTATION_FRAME_SPIKE',
            {
                averageFps,
                fps,
                rawDeltaMs,
                watchLabel: activeSpikeWatch.label,
                watchOffsetMs: performance.now() - activeSpikeWatch.startedAtMs,
            },
            { throttleKey: `watched-presentation-frame-spike:${activeSpikeWatch.label}`, throttleMs: 250 },
        );
    }
};

const createEmptyMotionState = (): PresentationMotionState => ({
    lastMapCenter: null,
    lastPlayerLocalPosition: null,
    lastPlayerScreenPosition: null,
    lastPlayerWorldPosition: null,
});

const syncPresentedPlayerToScene = (
    origin: Coords,
    presented: NonNullable<ReturnType<typeof drainForPresentation>>['state'],
) => {
    const playerRef = sceneRegistry.getEntityRef(PLAYER_ENTITY_ID);
    const [finalX, finalY, finalZ] = coordsToPlayerLocalPosition(presented.coords, origin);

    if (!playerRef) {
        return null;
    }

    playerRef.position.set(finalX, finalY, finalZ);
    playerRef.rotation.y = Math.PI - presented.bearing;

    const playerPresentationState = sceneRegistry.getPresentationState(PLAYER_ENTITY_ID);
    playerPresentationState.dirty = false;
    playerPresentationState.lastCoords = presented.coords;
    playerPresentationState.targetPosition = { x: finalX, y: finalY, z: finalZ };

    return playerRef;
};

const executeCameraFollow = ({
    activeSpikeWatch,
    averageFps,
    currentCenter,
    followCorrection,
    lastCameraCommitAtRef,
    map,
    nowMs,
    presented,
    staticCameraMode,
    viewportHeight,
    viewportWidth,
}: {
    activeSpikeWatch: ReturnType<typeof getActiveSpikeWatch>;
    averageFps: number;
    currentCenter: Coords;
    followCorrection: ReturnType<typeof resolveScreenSpaceFollowCorrection>;
    lastCameraCommitAtRef: { current: number };
    map: ReturnType<typeof useMap>;
    nowMs: number;
    presented: NonNullable<ReturnType<typeof drainForPresentation>>['state'];
    staticCameraMode: boolean;
    viewportHeight: number;
    viewportWidth: number;
}) => {
    const nextCenterProjection = map.unproject([
        viewportWidth / 2 + followCorrection.cameraDeltaPx.x,
        viewportHeight / 2 + followCorrection.cameraDeltaPx.y,
    ]);
    const decision = resolvePresentationCameraFollowDecision({
        autoFollowEnabled:
            !staticCameraMode &&
            shouldAutoFollowCamera({
                cooldownMs: MANUAL_CAMERA_INTERACTION_COOLDOWN_MS,
                lastManualInteractionAt: getLastManualMapInteractionAt(),
                now: nowMs,
            }),
        currentCenter,
        followCorrection,
        lastCameraCommitAtMs: lastCameraCommitAtRef.current,
        manualCameraOverrideActive: isManualCameraOverrideActive(),
        nextCenter: {
            lat: nextCenterProjection.lat,
            lng: nextCenterProjection.lng,
        },
        nowMs,
        staticCameraMode,
        targetCoords: presented.coords,
    });

    if (decision.shouldClearManualOverride) {
        clearManualCameraOverride();
    }

    if (decision.shouldRecordCooldownSkip) {
        recordCameraFollowCooldownSkip();
    }

    if (!decision.shouldCommitCamera) {
        return {
            cameraCommitStepMeters: 0,
            jumpToDurationMs: -1,
            recordedCenter: currentCenter,
        };
    }

    const jumpToStartedAt = performance.now();
    lastCameraCommitAtRef.current = nowMs;
    recordCameraFollow({
        appliedStepMeters: decision.cameraCommitStepMeters,
        distanceFromTargetMeters: decision.distanceFromTargetMeters,
    });
    map.easeTo({
        center: [decision.recordedCenter.lng, decision.recordedCenter.lat],
        duration: CAMERA_FOLLOW_EASE_DURATION_MS,
        easing: (time) => 1 - (1 - time) ** 3,
    });

    const jumpToDurationMs = performance.now() - jumpToStartedAt;
    atharDebugLog(
        'camera',
        'CAMERA_EDGE_RECENTER',
        {
            averageFps,
            cameraCommitStepMeters: decision.cameraCommitStepMeters,
            correctionXpx: followCorrection.cameraDeltaPx.x,
            correctionYpx: followCorrection.cameraDeltaPx.y,
            distanceFromTargetMeters: decision.distanceFromTargetMeters,
            jumpToDurationMs,
            screenCorrectionPx: followCorrection.correctionMagnitudePx,
            transitionDurationMs: CAMERA_FOLLOW_EASE_DURATION_MS,
        },
        { throttleMs: 120 },
    );

    if (jumpToDurationMs > 4) {
        atharDebugLog(
            'camera',
            'JUMP_TO_SPIKE',
            {
                averageFps,
                distanceFromTargetMeters: decision.distanceFromTargetMeters,
                jumpToDurationMs,
            },
            { throttleMs: 250 },
        );
    }

    if (activeSpikeWatch && jumpToDurationMs > WATCHED_JUMP_TO_SPIKE_THRESHOLD_MS) {
        atharDebugLog(
            'camera',
            'WATCHED_JUMP_TO_SPIKE',
            {
                averageFps,
                jumpToDurationMs,
                watchLabel: activeSpikeWatch.label,
                watchOffsetMs: performance.now() - activeSpikeWatch.startedAtMs,
            },
            { throttleKey: `watched-jump-to-spike:${activeSpikeWatch.label}`, throttleMs: 250 },
        );
    }

    return {
        cameraCommitStepMeters: decision.cameraCommitStepMeters,
        jumpToDurationMs,
        recordedCenter: currentCenter,
    };
};

const recordPresentationMotionDiagnostics = ({
    cameraCommitStepMeters,
    jumpToDurationMs,
    motionStateRef,
    playerRef,
    presented,
    projectedPlayer,
    rawDeltaMs,
    recordedCenter,
    sequence,
    timestampMs,
    viewportHeight,
    viewportWidth,
    worldPositionScratch,
}: {
    cameraCommitStepMeters: number;
    jumpToDurationMs: number;
    motionStateRef: { current: PresentationMotionState };
    playerRef: NonNullable<ReturnType<typeof sceneRegistry.getEntityRef>>;
    presented: NonNullable<ReturnType<typeof drainForPresentation>>['state'];
    projectedPlayer: { x: number; y: number };
    rawDeltaMs: number;
    recordedCenter: Coords;
    sequence: number;
    timestampMs: number;
    viewportHeight: number;
    viewportWidth: number;
    worldPositionScratch: Vector3;
}) => {
    if (!isAtharDebugEnabled()) {
        return;
    }

    playerRef.updateWorldMatrix(true, false);
    playerRef.getWorldPosition(worldPositionScratch);

    const { frame, nextState } = buildPresentationMotionFrame(
        {
            cameraCommitStepMeters,
            frameDeltaMs: rawDeltaMs,
            jumpToDurationMs,
            localPosition: { x: playerRef.position.x, z: playerRef.position.z },
            mapCenter: recordedCenter,
            playerScreenPosition: projectedPlayer,
            playerWorldPosition: {
                x: worldPositionScratch.x,
                y: worldPositionScratch.y,
                z: worldPositionScratch.z,
            },
            sequence,
            speed: presented.speed,
            timestampMs,
            viewportHeight,
            viewportWidth,
        },
        motionStateRef.current,
    );

    motionStateRef.current = nextState;
    reportMotionDiagnosticEvents(recordMotionDiagnosticFrame(frame));
};

export const PresentationRuntime = ({ origin }: PresentationRuntimeProps) => {
    const map = useMap();
    const lastCameraCommitAtRef = useRef(0);
    const lastRenderedSequenceRef = useRef(-1);
    const fpsSamplesRef = useRef<number[]>([]);
    const fpsDropActiveRef = useRef(false);
    const fpsDropFrameCountRef = useRef(0);
    const lastEmittedSpeedRef = useRef(-1);
    const motionStateRef = useRef<PresentationMotionState>(createEmptyMotionState());
    const staticCameraModeRef = useRef(readStaticCameraMode());
    const worldPositionScratchRef = useRef(new Vector3());

    useEffect(() => {
        return () => {
            sceneRegistry.clear();
        };
    }, []);

    useEffect(() => {
        const playerState = sceneRegistry.getPresentationState(PLAYER_ENTITY_ID);
        playerState.lastCoords = null;
        playerState.targetPosition = null;
        sceneRegistry.markDirty(PLAYER_ENTITY_ID);
        lastRenderedSequenceRef.current = -1;
        motionStateRef.current = createEmptyMotionState();
        resetMotionDiagnostics();
    }, [origin.lat, origin.lng]);

    useEffect(() => {
        if (staticCameraModeRef.current) {
            atharDebugLog('motion', 'STATIC_CAMERA_ENABLED');
        }
    }, []);

    useFrame((_, rawDelta) => {
        const nowMs = performance.now();
        const rawDeltaMs = rawDelta * 1_000;
        const fps = rawDelta > 0 ? 1 / rawDelta : 0;
        const averageFps = pushFpsSample(fpsSamplesRef.current, fps);
        const activeSpikeWatch = getActiveSpikeWatch();

        reportRenderFpsState({
            averageFps,
            dropActiveRef: fpsDropActiveRef,
            dropFrameCountRef: fpsDropFrameCountRef,
            fps,
            rawDeltaMs,
        });

        reportFrameSpikes({ activeSpikeWatch, averageFps, fps, rawDeltaMs });

        const drainResult = drainForPresentation(lastRenderedSequenceRef.current);
        if (!drainResult) {
            motionStateRef.current = createEmptyMotionState();
            return;
        }

        lastRenderedSequenceRef.current = drainResult.sequence;
        const presented = drainResult.state;

        if (presented.speed !== lastEmittedSpeedRef.current) {
            lastEmittedSpeedRef.current = presented.speed;
            updatePlayerRuntimeMovement(presented);
        }

        const playerRef = syncPresentedPlayerToScene(origin, presented);

        if (!useLevelStore.getState().config) {
            motionStateRef.current = createEmptyMotionState();
            return;
        }

        const mapCenter = map.getCenter();
        const currentCenter = { lat: mapCenter.lat, lng: mapCenter.lng };
        const viewportWidth = map.getContainer().clientWidth;
        const viewportHeight = map.getContainer().clientHeight;
        const projectedPlayer = map.project([presented.coords.lng, presented.coords.lat]);
        const followCorrection = resolveScreenSpaceFollowCorrection({
            deadzoneXFraction: CAMERA_FOLLOW_SCREEN_DEADZONE_X,
            deadzoneYFraction: CAMERA_FOLLOW_SCREEN_DEADZONE_Y,
            minimumCorrectionPx: CAMERA_FOLLOW_MIN_CORRECTION_PX,
            point: projectedPlayer,
            viewportHeight,
            viewportWidth,
        });
        const { cameraCommitStepMeters, jumpToDurationMs, recordedCenter } = executeCameraFollow({
            activeSpikeWatch,
            averageFps,
            currentCenter,
            followCorrection,
            lastCameraCommitAtRef,
            map,
            nowMs,
            presented,
            staticCameraMode: staticCameraModeRef.current,
            viewportHeight,
            viewportWidth,
        });

        if (!playerRef) {
            motionStateRef.current = createEmptyMotionState();
            return;
        }

        recordPresentationMotionDiagnostics({
            cameraCommitStepMeters,
            jumpToDurationMs,
            motionStateRef,
            playerRef,
            presented,
            projectedPlayer,
            rawDeltaMs,
            recordedCenter,
            sequence: drainResult.sequence,
            timestampMs: nowMs,
            viewportHeight,
            viewportWidth,
            worldPositionScratch: worldPositionScratchRef.current,
        });
    });

    return null;
};
