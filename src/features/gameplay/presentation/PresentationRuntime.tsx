import { useFrame } from '@react-three/fiber';
import { useEffect } from 'react';
import { coordsToVector3, useMap } from 'react-three-map/maplibre';

import type { Coords } from '@/content/levels/types';
import { atharDebugLog } from '@/features/debug/debug';
import {
    getLastManualMapInteractionAt,
    recordCameraFollow,
    recordCameraFollowCooldownSkip,
} from '@/features/debug/perf-metrics';
import { sceneRegistry } from '@/features/gameplay/presentation/SceneRegistry';
import type { RendererBridge } from '@/features/gameplay/presentation/types';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { resolveCameraFollow, shouldAutoFollowCamera } from '@/features/gameplay/systems/player-motion';
import { BASE_PLAYER_SPEED_METERS_PER_SECOND } from '@/shared/constants/gameplay';

const PLAYER_ENTITY_ID = 'player';
const CAMERA_FOLLOW_DAMPING = 10;
const CAMERA_FOLLOW_DEADZONE_METERS = 80;
const CAMERA_FOLLOW_MAX_SPEED_MPS = BASE_PLAYER_SPEED_METERS_PER_SECOND * 1.5;
const MANUAL_CAMERA_INTERACTION_COOLDOWN_MS = 900;

type PresentationRuntimeProps = {
    origin: Coords;
};

const coordsMatch = (left: Coords | null, right: Coords) =>
    left !== null && left.lat === right.lat && left.lng === right.lng;

export const rendererBridge: RendererBridge = {
    consume: () => {
        sceneRegistry.markDirty(PLAYER_ENTITY_ID);
    },
};

export const PresentationRuntime = ({ origin }: PresentationRuntimeProps) => {
    const map = useMap();

    useEffect(() => {
        sceneRegistry.clear();

        return () => {
            sceneRegistry.clear();
        };
    }, [origin.lat, origin.lng]);

    useFrame((_, rawDelta) => {
        const delta = Math.min(rawDelta, 0.034);
        const playerCoords = usePlayerStore.getState().coords;
        const playerRef = sceneRegistry.getEntityRef(PLAYER_ENTITY_ID);
        const playerPresentationState = sceneRegistry.getPresentationState(PLAYER_ENTITY_ID);

        if (
            playerRef &&
            (!coordsMatch(playerPresentationState.lastCoords, playerCoords) || playerPresentationState.dirty)
        ) {
            const [x, y, z] = coordsToVector3(
                { latitude: playerCoords.lat, longitude: playerCoords.lng },
                { latitude: origin.lat, longitude: origin.lng },
            );

            playerPresentationState.dirty = false;
            playerPresentationState.lastCoords = playerCoords;
            playerPresentationState.targetPosition = { x, y, z };
            playerRef.position.set(x, y, z);
        }

        const levelState = useLevelStore.getState();
        if (!levelState.config) {
            return;
        }

        const autoFollowEnabled = shouldAutoFollowCamera({
            cooldownMs: MANUAL_CAMERA_INTERACTION_COOLDOWN_MS,
            lastManualInteractionAt: getLastManualMapInteractionAt(),
            now: performance.now(),
        });

        if (!autoFollowEnabled) {
            recordCameraFollowCooldownSkip();
            return;
        }

        const mapCenter = map.getCenter();
        const currentCenter = { lat: mapCenter.lat, lng: mapCenter.lng };

        const follow = resolveCameraFollow({
            currentCenter,
            damping: CAMERA_FOLLOW_DAMPING,
            deadzoneMeters: CAMERA_FOLLOW_DEADZONE_METERS,
            delta,
            maxSpeedMetersPerSecond: CAMERA_FOLLOW_MAX_SPEED_MPS,
            targetCoords: playerCoords,
        });

        if (!follow.moved) {
            return;
        }

        recordCameraFollow({
            appliedStepMeters: follow.appliedStepMeters,
            distanceFromTargetMeters: follow.distanceFromCamera,
        });

        map.jumpTo({
            center: [follow.nextCenter.lng, follow.nextCenter.lat],
        });

        atharDebugLog(
            'camera',
            'follow',
            {
                center: follow.nextCenter,
                distance: follow.distanceFromCamera,
                step: follow.appliedStepMeters,
                target: playerCoords,
            },
            { throttleMs: 200 },
        );
    });

    return null;
};
