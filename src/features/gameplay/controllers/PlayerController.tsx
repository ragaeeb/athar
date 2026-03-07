import { useEffect } from 'react';
import { atharDebugLog } from '@/features/debug/debug';
import { clearInputState, getPressedKeys, setInputKeyPressed } from '@/features/gameplay/controllers/input-state';

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

const clearPressedKeys = (reason: 'blur-reset' | 'visibility-reset' | 'unmount-reset') => {
    const pressedKeys = getPressedKeys();
    if (pressedKeys.length === 0) {
        return;
    }

    clearInputState();
    atharDebugLog('controller', reason, { pressed: pressedKeys }, { throttleMs: 50 });
};

export const PlayerController = () => {
    useEffect(() => {
        atharDebugLog('controller', 'mounted');

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.repeat) {
                return;
            }

            updateKeyState(event, true, 'keydown');
        };

        const onKeyUp = (event: KeyboardEvent) => {
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
