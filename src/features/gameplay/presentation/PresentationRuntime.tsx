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
import { positionMetersToPlayerLocalPosition } from '@/features/gameplay/presentation/player-local-position';
import { sceneRegistry } from '@/features/gameplay/presentation/SceneRegistry';
import { updatePlayerRuntimeMovement } from '@/features/gameplay/runtime/player-runtime';
import { drainForPresentation } from '@/features/gameplay/runtime/simulation-bridge';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { resolveScreenSpaceFollowCorrection, shouldAutoFollowCamera } from '@/features/gameplay/systems/player-motion';
import { worldDistanceInMeters } from '@/shared/geo';

const PLAYER_ENTITY_ID = 'player';
const CAMERA_FOLLOW_SNAP_COOLDOWN_MS = 280;
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

export const PresentationRuntime = ({ origin }: PresentationRuntimeProps) => {
    const map = useMap();
    const lastCameraCommitAtRef = useRef(0);
    const lastRenderedSequenceRef = useRef(-1);
    const fpsSamplesRef = useRef<number[]>([]);
    const fpsDropActiveRef = useRef(false);
    const fpsDropFrameCountRef = useRef(0);
    const lastEmittedSpeedRef = useRef(-1);
    const lastMapCenterRef = useRef<Coords | null>(null);
    const lastPlayerLocalPositionRef = useRef<{ x: number; z: number } | null>(null);
    const lastPlayerScreenPositionRef = useRef<{ x: number; y: number } | null>(null);
    const lastPlayerWorldPositionRef = useRef<Vector3 | null>(null);
    const playerWorldPositionRef = useRef(new Vector3());
    const staticCameraModeRef = useRef(readStaticCameraMode());

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
        lastMapCenterRef.current = null;
        lastPlayerLocalPositionRef.current = null;
        lastPlayerScreenPositionRef.current = null;
        lastPlayerWorldPositionRef.current = null;
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
            return;
        }

        lastRenderedSequenceRef.current = drainResult.sequence;
        const presented = drainResult.state;

        if (presented.speed !== lastEmittedSpeedRef.current) {
            lastEmittedSpeedRef.current = presented.speed;
            updatePlayerRuntimeMovement(presented);
        }

        const playerRef = sceneRegistry.getEntityRef(PLAYER_ENTITY_ID);
        let finalX = 0;
        let finalY = 0;
        let finalZ = 0;

        if (playerRef) {
            [finalX, finalY, finalZ] = positionMetersToPlayerLocalPosition(presented.positionMeters);

            playerRef.position.set(finalX, finalY, finalZ);
            playerRef.rotation.y = Math.PI - presented.bearing;

            const playerPresentationState = sceneRegistry.getPresentationState(PLAYER_ENTITY_ID);
            playerPresentationState.dirty = false;
            playerPresentationState.lastCoords = presented.coords;
            playerPresentationState.targetPosition = { x: finalX, y: finalY, z: finalZ };
        }

        const levelState = useLevelStore.getState();
        if (!levelState.config) {
            return;
        }

        const mapCenter = map.getCenter();
        const currentCenter = { lat: mapCenter.lat, lng: mapCenter.lng };
        const viewportWidth = map.getContainer().clientWidth;
        const viewportHeight = map.getContainer().clientHeight;
        const projectedPlayer = map.project([presented.coords.lng, presented.coords.lat]);
        let _jumpToDurationMs = -1;
        let cameraCommitStepMeters = 0;
        let recordedCenter = currentCenter;

        const autoFollowEnabled =
            !staticCameraModeRef.current &&
            shouldAutoFollowCamera({
                cooldownMs: MANUAL_CAMERA_INTERACTION_COOLDOWN_MS,
                lastManualInteractionAt: getLastManualMapInteractionAt(),
                now: nowMs,
            });
        const followCorrection = resolveScreenSpaceFollowCorrection({
            deadzoneXFraction: CAMERA_FOLLOW_SCREEN_DEADZONE_X,
            deadzoneYFraction: CAMERA_FOLLOW_SCREEN_DEADZONE_Y,
            minimumCorrectionPx: CAMERA_FOLLOW_MIN_CORRECTION_PX,
            point: projectedPlayer,
            viewportHeight,
            viewportWidth,
        });
        const manualCameraOverrideActive = isManualCameraOverrideActive();

        if (manualCameraOverrideActive && !followCorrection.moved) {
            clearManualCameraOverride();
        }

        if (autoFollowEnabled && !manualCameraOverrideActive) {
            const distanceFromTargetMeters = worldDistanceInMeters(currentCenter, presented.coords);
            const shouldSnapCamera = distanceFromTargetMeters > 0 && followCorrection.moved;

            if (shouldSnapCamera) {
                if (nowMs - lastCameraCommitAtRef.current >= CAMERA_FOLLOW_SNAP_COOLDOWN_MS) {
                    const jumpToStartedAt = performance.now();
                    lastCameraCommitAtRef.current = nowMs;
                    const nextCenter = map.unproject([
                        viewportWidth / 2 + followCorrection.cameraDeltaPx.x,
                        viewportHeight / 2 + followCorrection.cameraDeltaPx.y,
                    ]);

                    recordedCenter = {
                        lat: nextCenter.lat,
                        lng: nextCenter.lng,
                    };
                    cameraCommitStepMeters = worldDistanceInMeters(recordedCenter, currentCenter);
                    recordCameraFollow({
                        appliedStepMeters: cameraCommitStepMeters,
                        distanceFromTargetMeters,
                    });
                    map.easeTo({
                        center: [recordedCenter.lng, recordedCenter.lat],
                        duration: CAMERA_FOLLOW_EASE_DURATION_MS,
                        easing: (time) => 1 - (1 - time) ** 3,
                    });
                    _jumpToDurationMs = performance.now() - jumpToStartedAt;
                    atharDebugLog(
                        'camera',
                        'CAMERA_EDGE_RECENTER',
                        {
                            averageFps,
                            cameraCommitStepMeters,
                            correctionXpx: followCorrection.cameraDeltaPx.x,
                            correctionYpx: followCorrection.cameraDeltaPx.y,
                            distanceFromTargetMeters,
                            jumpToDurationMs: _jumpToDurationMs,
                            screenCorrectionPx: followCorrection.correctionMagnitudePx,
                            transitionDurationMs: CAMERA_FOLLOW_EASE_DURATION_MS,
                        },
                        { throttleMs: 120 },
                    );
                    if (_jumpToDurationMs > 4) {
                        atharDebugLog(
                            'camera',
                            'JUMP_TO_SPIKE',
                            {
                                averageFps,
                                distanceFromTargetMeters,
                                jumpToDurationMs: _jumpToDurationMs,
                            },
                            { throttleMs: 250 },
                        );
                    }

                    if (activeSpikeWatch && _jumpToDurationMs > WATCHED_JUMP_TO_SPIKE_THRESHOLD_MS) {
                        atharDebugLog(
                            'camera',
                            'WATCHED_JUMP_TO_SPIKE',
                            {
                                averageFps,
                                jumpToDurationMs: _jumpToDurationMs,
                                watchLabel: activeSpikeWatch.label,
                                watchOffsetMs: performance.now() - activeSpikeWatch.startedAtMs,
                            },
                            { throttleKey: `watched-jump-to-spike:${activeSpikeWatch.label}`, throttleMs: 250 },
                        );
                    }
                }
            }
        } else if (!staticCameraModeRef.current) {
            recordCameraFollowCooldownSkip();
        }

        if (!isAtharDebugEnabled() || !playerRef) {
            return;
        }

        const lastLocalPosition = lastPlayerLocalPositionRef.current;
        const localStepMeters = lastLocalPosition
            ? Math.hypot(finalX - lastLocalPosition.x, finalZ - lastLocalPosition.z)
            : 0;
        lastPlayerLocalPositionRef.current = { x: finalX, z: finalZ };

        playerRef.updateWorldMatrix(true, false);
        playerRef.getWorldPosition(playerWorldPositionRef.current);

        const worldStepMeters = lastPlayerWorldPositionRef.current
            ? playerWorldPositionRef.current.distanceTo(lastPlayerWorldPositionRef.current)
            : 0;

        if (!lastPlayerWorldPositionRef.current) {
            lastPlayerWorldPositionRef.current = new Vector3();
        }
        lastPlayerWorldPositionRef.current.copy(playerWorldPositionRef.current);

        const cameraCenterStepMeters = lastMapCenterRef.current
            ? worldDistanceInMeters(recordedCenter, lastMapCenterRef.current)
            : 0;
        lastMapCenterRef.current = recordedCenter;

        const screenCenter = {
            x: viewportWidth / 2,
            y: viewportHeight / 2,
        };
        const screenOffsetPx = Math.hypot(projectedPlayer.x - screenCenter.x, projectedPlayer.y - screenCenter.y);
        const screenStepPx = lastPlayerScreenPositionRef.current
            ? Math.hypot(
                  projectedPlayer.x - lastPlayerScreenPositionRef.current.x,
                  projectedPlayer.y - lastPlayerScreenPositionRef.current.y,
              )
            : 0;
        lastPlayerScreenPositionRef.current = { x: projectedPlayer.x, y: projectedPlayer.y };

        reportMotionDiagnosticEvents(
            recordMotionDiagnosticFrame({
                cameraCenterStepMeters,
                cameraCommitStepMeters,
                frameDeltaMs: rawDeltaMs,
                jumpToDurationMs: _jumpToDurationMs,
                localStepMeters,
                screenOffsetPx,
                screenStepPx,
                sequence: drainResult.sequence,
                speed: presented.speed,
                timestampMs: nowMs,
                worldStepMeters,
            }),
        );
    });

    return null;
};
