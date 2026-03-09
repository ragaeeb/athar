import { useEffect } from 'react';
import { atharDebugLog } from '@/features/debug/debug';
import { clearInputState, getPressedKeys, setInputKeyPressed } from '@/features/gameplay/controllers/input-state';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { useGameplaySessionStore } from '@/features/gameplay/state/session.store';

const updateKeyState = (event: KeyboardEvent, pressed: boolean, eventName: 'keydown' | 'keyup') => {
    if (event.key.startsWith('Arrow')) {
        event.preventDefault();
    }

    setInputKeyPressed(event.key, pressed);
    atharDebugLog(
        'controller',
        eventName,
        {
            key: event.key,
            pressed: getPressedKeys(),
        },
        { throttleKey: `controller:${eventName}:${event.key}`, throttleMs: 50 },
    );
};

const clearPressedKeys = (reason: 'blur-reset' | 'pause-reset' | 'unmount-reset' | 'visibility-reset') => {
    const pressedKeys = getPressedKeys();
    if (pressedKeys.length === 0) {
        return;
    }

    clearInputState();
    atharDebugLog('controller', reason, { pressed: pressedKeys }, { throttleMs: 50 });
};

const togglePause = () => {
    useGameplaySessionStore.getState().togglePause();
    atharDebugLog('controller', 'pause-toggle', {
        paused: useGameplaySessionStore.getState().paused,
    });
};

const blockPausedMovementKey = (event: KeyboardEvent) => {
    if (!useGameplaySessionStore.getState().paused) {
        return false;
    }

    if (event.key.startsWith('Arrow')) {
        event.preventDefault();
    }

    return true;
};

const handlePauseKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
        return false;
    }

    if (usePlayerStore.getState().dialogueOpen) {
        return true;
    }

    event.preventDefault();
    togglePause();
    return true;
};

export const PlayerController = () => {
    const paused = useGameplaySessionStore((state) => state.paused);

    useEffect(() => {
        if (paused) {
            clearPressedKeys('pause-reset');
        }
    }, [paused]);

    useEffect(() => {
        atharDebugLog('controller', 'mounted');

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.repeat) {
                return;
            }

            if (handlePauseKeyDown(event)) {
                return;
            }

            if (blockPausedMovementKey(event)) {
                return;
            }

            updateKeyState(event, true, 'keydown');
        };

        const onKeyUp = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                return;
            }

            if (blockPausedMovementKey(event)) {
                return;
            }

            updateKeyState(event, false, 'keyup');
        };

        const onWindowBlur = () => {
            clearPressedKeys('blur-reset');
        };

        const onVisibilityChange = () => {
            if (document.hidden) {
                clearPressedKeys('visibility-reset');
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onWindowBlur);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            atharDebugLog('controller', 'unmounted');
            clearPressedKeys('unmount-reset');
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onWindowBlur);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    return null;
};
