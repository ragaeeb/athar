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
type MovementInput = { moveX: number; moveZ: number };

const getPressedKeys = (keyState: KeyState) => Object.keys(keyState).filter((key) => keyState[key]);

const updateKeyState = (keyState: KeyState, event: KeyboardEvent, pressed: boolean, eventName: 'keydown' | 'keyup') => {
    if (event.key.startsWith('Arrow')) {
        event.preventDefault();
    }

    keyState[event.key] = pressed;
    atharDebugLog(
        'controller',
        eventName,
        {
            key: event.key,
            pressed: getPressedKeys(keyState),
        },
        { throttleKey: `controller:${eventName}:${event.key}`, throttleMs: 50 },
    );
};

const getMovementInput = (keyState: KeyState): MovementInput => ({
    moveX: (keyState.d || keyState.ArrowRight ? 1 : 0) - (keyState.a || keyState.ArrowLeft ? 1 : 0),
    moveZ: (keyState.w || keyState.ArrowUp ? 1 : 0) - (keyState.s || keyState.ArrowDown ? 1 : 0),
});

const stopMovement = (
    playerState: ReturnType<typeof usePlayerStore.getState>,
    reason: 'movement-blocked' | 'movement-stop',
    details: object,
) => {
    if (playerState.speed === 0) {
        return;
    }

    usePlayerStore.getState().setBearingAndSpeed(playerState.bearing, 0);
    atharDebugLog('controller', reason, details, { throttleMs: reason === 'movement-blocked' ? 250 : 200 });
};

const clearPressedKeys = (keyState: React.MutableRefObject<KeyState>, reason: 'blur-reset' | 'visibility-reset') => {
    const pressedKeys = getPressedKeys(keyState.current);
    if (pressedKeys.length === 0) {
        return;
    }

    keyState.current = {};
    const playerState = usePlayerStore.getState();
    if (playerState.speed !== 0) {
        usePlayerStore.getState().setBearingAndSpeed(playerState.bearing, 0);
    }

    atharDebugLog('controller', reason, { pressed: pressedKeys }, { throttleMs: 50 });
};

const applyMovement = ({
    characterSpeedMultiplier,
    delta,
    input,
    lastMotionSignatureRef,
    levelOrigin,
    playerState,
}: {
    characterSpeedMultiplier: number;
    delta: number;
    input: MovementInput;
    lastMotionSignatureRef: { current: string };
    levelOrigin: { lat: number; lng: number };
    playerState: ReturnType<typeof usePlayerStore.getState>;
}) => {
    recordPlayerMovementTick();

    const speed = BASE_PLAYER_SPEED_METERS_PER_SECOND * characterSpeedMultiplier;
    const movement = resolveMovementStep({
        delta,
        moveX: input.moveX,
        moveZ: input.moveZ,
        origin: levelOrigin,
        positionMeters: playerState.positionMeters,
        scrambleMultiplier: 1,
        speed,
    });
    const motionSignature = [
        input.moveX,
        input.moveZ,
        movement.bearing.toFixed(3),
        movement.nextPositionMeters.x.toFixed(0),
        movement.nextPositionMeters.z.toFixed(0),
    ].join('|');

    usePlayerStore.getState().updateMovement({
        bearing: movement.bearing,
        coords: movement.nextCoords,
        positionMeters: movement.nextPositionMeters,
        speed,
    });

    if (motionSignature !== lastMotionSignatureRef.current) {
        lastMotionSignatureRef.current = motionSignature;
        atharDebugLog(
            'controller',
            'movement-change',
            {
                bearing: movement.bearing,
                coords: movement.nextCoords,
                delta,
                moveX: input.moveX,
                moveZ: input.moveZ,
                positionMeters: movement.nextPositionMeters,
                speed,
            },
            { throttleMs: 80 },
        );
        return;
    }

    atharDebugLog(
        'controller',
        'movement-tick',
        {
            bearing: movement.bearing,
            coords: movement.nextCoords,
            moveX: input.moveX,
            moveZ: input.moveZ,
            positionMeters: movement.nextPositionMeters,
        },
        { throttleMs: 200 },
    );
};

export const PlayerController = () => {
    const keyState = useRef<KeyState>({});
    const lastMotionSignatureRef = useRef<string>('');

    useEffect(() => {
        atharDebugLog('controller', 'mounted');

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.repeat) {
                return;
            }

            updateKeyState(keyState.current, event, true, 'keydown');
        };

        const onKeyUp = (event: KeyboardEvent) => {
            updateKeyState(keyState.current, event, false, 'keyup');
        };

        const onWindowBlur = () => {
            clearPressedKeys(keyState, 'blur-reset');
        };

        const onVisibilityChange = () => {
            if (document.hidden) {
                clearPressedKeys(keyState, 'visibility-reset');
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onWindowBlur);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            atharDebugLog('controller', 'unmounted');
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onWindowBlur);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    useFrame((_, rawDelta) => {
        const delta = Math.min(rawDelta, 0.034);
        recordFrameDeltaMs(delta * 1_000);

        const playerState = usePlayerStore.getState();
        const levelState = useLevelStore.getState();
        const characterConfig = CHARACTER_CONFIGS[useGameStore.getState().selectedCharacter];

        if (!levelState.config || levelState.isComplete || playerState.dialogueOpen) {
            stopMovement(playerState, 'movement-blocked', {
                dialogueOpen: playerState.dialogueOpen,
                isComplete: levelState.isComplete,
                levelReady: Boolean(levelState.config),
            });
            return;
        }

        const movementInput = getMovementInput(keyState.current);

        if (movementInput.moveX === 0 && movementInput.moveZ === 0) {
            stopMovement(playerState, 'movement-stop', { coords: playerState.coords });
            return;
        }

        applyMovement({
            characterSpeedMultiplier: characterConfig.speedMultiplier,
            delta,
            input: movementInput,
            lastMotionSignatureRef,
            levelOrigin: levelState.config.origin,
            playerState,
        });
    });

    return null;
};
