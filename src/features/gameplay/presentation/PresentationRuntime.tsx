import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { coordsToVector3, useMap } from 'react-three-map/maplibre';

import type { Coords } from '@/content/levels/types';
import { atharDebugLog } from '@/features/debug/debug';
import {
    getLastManualMapInteractionAt,
    recordCameraFollow,
    recordCameraFollowCooldownSkip,
} from '@/features/debug/perf-metrics';
import { getActiveSpikeWatch } from '@/features/debug/spike-watch';
import { sceneRegistry } from '@/features/gameplay/presentation/SceneRegistry';
import { updatePlayerRuntimeMovement } from '@/features/gameplay/runtime/player-runtime';
import { drainForPresentation } from '@/features/gameplay/runtime/simulation-bridge';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { resolveCameraFollow, shouldAutoFollowCamera } from '@/features/gameplay/systems/player-motion';
import { BASE_PLAYER_SPEED_METERS_PER_SECOND } from '@/shared/constants/gameplay';

const PLAYER_ENTITY_ID = 'player';
const CAMERA_FOLLOW_DAMPING = 10;
const CAMERA_FOLLOW_DEADZONE_METERS = 80;
const CAMERA_FOLLOW_MAX_SPEED_MPS = BASE_PLAYER_SPEED_METERS_PER_SECOND * 1.5;
const CAMERA_FOLLOW_MIN_INTERVAL_MS = 1_000 / 60;
const MANUAL_CAMERA_INTERACTION_COOLDOWN_MS = 900;
const FPS_DROP_THRESHOLD = 50;
const FPS_RECOVERY_THRESHOLD = 57;
const FPS_SAMPLE_WINDOW = 20;
const FPS_SUSTAINED_DROP_FRAMES = 8;

type PresentationRuntimeProps = {
    origin: Coords;
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

    if (activeSpikeWatch && rawDeltaMs > 16.7) {
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
            { throttleKey: `watched-presentation-frame-spike:${activeSpikeWatch.label}`, throttleMs: 120 },
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
    }, [origin.lat, origin.lng]);

    useFrame((_, rawDelta) => {
        const nowMs = performance.now();
        const delta = Math.min(rawDelta, 0.034);
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
            [finalX, finalY, finalZ] = coordsToVector3(
                { latitude: presented.coords.lat, longitude: presented.coords.lng },
                { latitude: origin.lat, longitude: origin.lng },
            );

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

        let _jumpToDurationMs = -1;

        const autoFollowEnabled = shouldAutoFollowCamera({
            cooldownMs: MANUAL_CAMERA_INTERACTION_COOLDOWN_MS,
            lastManualInteractionAt: getLastManualMapInteractionAt(),
            now: nowMs,
        });

        if (autoFollowEnabled) {
            const mapCenter = map.getCenter();
            const currentCenter = { lat: mapCenter.lat, lng: mapCenter.lng };

            const follow = resolveCameraFollow({
                currentCenter,
                damping: CAMERA_FOLLOW_DAMPING,
                deadzoneMeters: CAMERA_FOLLOW_DEADZONE_METERS,
                delta,
                maxSpeedMetersPerSecond: CAMERA_FOLLOW_MAX_SPEED_MPS,
                targetCoords: presented.coords,
            });

            if (follow.moved) {
                recordCameraFollow({
                    appliedStepMeters: follow.appliedStepMeters,
                    distanceFromTargetMeters: follow.distanceFromCamera,
                });

                if (nowMs - lastCameraCommitAtRef.current >= CAMERA_FOLLOW_MIN_INTERVAL_MS) {
                    const jumpToStartedAt = performance.now();
                    lastCameraCommitAtRef.current = nowMs;
                    map.jumpTo({
                        center: [follow.nextCenter.lng, follow.nextCenter.lat],
                    });
                    _jumpToDurationMs = performance.now() - jumpToStartedAt;
                    if (_jumpToDurationMs > 4) {
                        atharDebugLog(
                            'camera',
                            'JUMP_TO_SPIKE',
                            {
                                averageFps,
                                distanceFromTargetMeters: follow.distanceFromCamera,
                                jumpToDurationMs: _jumpToDurationMs,
                            },
                            { throttleMs: 250 },
                        );
                    }

                    if (activeSpikeWatch && _jumpToDurationMs > 1.5) {
                        atharDebugLog(
                            'camera',
                            'WATCHED_JUMP_TO_SPIKE',
                            {
                                averageFps,
                                jumpToDurationMs: _jumpToDurationMs,
                                watchLabel: activeSpikeWatch.label,
                                watchOffsetMs: performance.now() - activeSpikeWatch.startedAtMs,
                            },
                            { throttleKey: `watched-jump-to-spike:${activeSpikeWatch.label}`, throttleMs: 120 },
                        );
                    }
                }
            }
        } else {
            recordCameraFollowCooldownSkip();
        }
    });

    return null;
};
