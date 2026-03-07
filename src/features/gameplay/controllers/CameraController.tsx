import { useFrame } from '@react-three/fiber';
import { useMap } from 'react-three-map/maplibre';
import { atharDebugLog } from '@/features/debug/debug';
import {
    getLastManualMapInteractionAt,
    recordCameraFollow,
    recordCameraFollowCooldownSkip,
} from '@/features/debug/perf-metrics';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { resolveCameraFollow, shouldAutoFollowCamera } from '@/features/gameplay/systems/player-motion';
import { BASE_PLAYER_SPEED_METERS_PER_SECOND } from '@/shared/constants/gameplay';

const CAMERA_FOLLOW_DAMPING = 10;
const CAMERA_FOLLOW_DEADZONE_METERS = 80;
const CAMERA_FOLLOW_MAX_SPEED_MPS = BASE_PLAYER_SPEED_METERS_PER_SECOND * 1.5;
const MANUAL_CAMERA_INTERACTION_COOLDOWN_MS = 900;

export const CameraController = () => {
    const map = useMap();

    useFrame((_, rawDelta) => {
        const delta = Math.min(rawDelta, 0.034);
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

        const playerCoords = usePlayerStore.getState().coords;
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

        if (follow.moved) {
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
        }
    });

    return null;
};
