import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/game/store/game.store';
import { useLevelStore } from '@/game/store/level.store';
import { usePlayerStore } from '@/game/store/player.store';
import { BASE_PLAYER_SPEED_METERS_PER_SECOND, CHARACTER_CONFIGS } from '@/lib/constants';
import { atharDebugLog } from '@/lib/debug';
import { recordFrameDeltaMs, recordPlayerMovementTick } from '@/lib/perf-metrics';
import { resolveMovementStep } from './player-motion';

type KeyState = Record<string, boolean>;

export const PlayerController = () => {
    const keyState = useRef<KeyState>({});
    const lastMotionSignatureRef = useRef<string>('');

    useEffect(() => {
        atharDebugLog('controller', 'mounted');

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.repeat) {
                return;
            }

            if (event.key.startsWith('Arrow')) {
                event.preventDefault();
            }

            keyState.current[event.key] = true;
            atharDebugLog(
                'controller',
                'keydown',
                {
                    key: event.key,
                    pressed: Object.keys(keyState.current).filter((key) => keyState.current[key]),
                },
                { throttleKey: `controller:keydown:${event.key}`, throttleMs: 50 },
            );
        };

        const onKeyUp = (event: KeyboardEvent) => {
            if (event.key.startsWith('Arrow')) {
                event.preventDefault();
            }

            keyState.current[event.key] = false;
            atharDebugLog(
                'controller',
                'keyup',
                {
                    key: event.key,
                    pressed: Object.keys(keyState.current).filter((key) => keyState.current[key]),
                },
                { throttleKey: `controller:keyup:${event.key}`, throttleMs: 50 },
            );
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            atharDebugLog('controller', 'unmounted');
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    useFrame((_, rawDelta) => {
        const delta = Math.min(rawDelta, 0.034);
        recordFrameDeltaMs(delta * 1_000);

        const playerState = usePlayerStore.getState();
        const levelState = useLevelStore.getState();
        const characterConfig = CHARACTER_CONFIGS[useGameStore.getState().selectedCharacter];

        if (!levelState.config || levelState.isComplete || playerState.dialogueOpen) {
            if (playerState.speed !== 0) {
                usePlayerStore.getState().setBearingAndSpeed(playerState.bearing, 0);
                atharDebugLog(
                    'controller',
                    'movement-blocked',
                    {
                        dialogueOpen: playerState.dialogueOpen,
                        isComplete: levelState.isComplete,
                        levelReady: Boolean(levelState.config),
                    },
                    { throttleMs: 250 },
                );
            }

            return;
        }

        const moveX =
            (keyState.current.d || keyState.current.ArrowRight ? 1 : 0) -
            (keyState.current.a || keyState.current.ArrowLeft ? 1 : 0);
        const moveZ =
            (keyState.current.w || keyState.current.ArrowUp ? 1 : 0) -
            (keyState.current.s || keyState.current.ArrowDown ? 1 : 0);

        if (moveX === 0 && moveZ === 0) {
            if (playerState.speed !== 0) {
                usePlayerStore.getState().setBearingAndSpeed(playerState.bearing, 0);
                atharDebugLog('controller', 'movement-stop', { coords: playerState.coords }, { throttleMs: 200 });
            }

            return;
        }

        recordPlayerMovementTick();

        const scrambleMultiplier = playerState.scrambleUntil > Date.now() ? -1 : 1;
        const speed = BASE_PLAYER_SPEED_METERS_PER_SECOND * characterConfig.speedMultiplier;
        const movement = resolveMovementStep({
            delta,
            moveX,
            moveZ,
            origin: levelState.config.origin,
            positionMeters: playerState.positionMeters,
            scrambleMultiplier,
            speed,
        });
        const motionSignature = [
            moveX,
            moveZ,
            movement.bearing.toFixed(3),
            movement.nextPositionMeters.x.toFixed(0),
            movement.nextPositionMeters.z.toFixed(0),
        ].join('|');

        usePlayerStore.getState().setLocation(movement.nextCoords, movement.nextPositionMeters);
        usePlayerStore.getState().setBearingAndSpeed(movement.bearing, speed);

        if (motionSignature !== lastMotionSignatureRef.current) {
            lastMotionSignatureRef.current = motionSignature;
            atharDebugLog(
                'controller',
                'movement-change',
                {
                    bearing: movement.bearing,
                    coords: movement.nextCoords,
                    delta,
                    moveX,
                    moveZ,
                    positionMeters: movement.nextPositionMeters,
                    speed,
                },
                { throttleMs: 80 },
            );
        } else {
            atharDebugLog(
                'controller',
                'movement-tick',
                {
                    bearing: movement.bearing,
                    coords: movement.nextCoords,
                    moveX,
                    moveZ,
                    positionMeters: movement.nextPositionMeters,
                },
                { throttleMs: 200 },
            );
        }
    });

    return null;
};
