import { useEffect, useState } from 'react';

import { clearTouchMovementInput, setTouchMovementInput } from '@/features/gameplay/controllers/input-state';
import { supportsTouchTraversalControls } from '@/features/gameplay/controllers/touch-support';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { useGameplaySessionStore } from '@/features/gameplay/state/session.store';
import { Card } from '@/shared/ui/Card';

const TOUCH_PAD_RADIUS_PX = 56;

const clampAxis = (value: number) => Math.max(-1, Math.min(1, value));

const resolveTouchMovement = (clientX: number, clientY: number, bounds: DOMRect) => {
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const cappedDistance = Math.min(distance, TOUCH_PAD_RADIUS_PX);
    const ratio = distance > 0 ? cappedDistance / distance : 0;
    const knobX = deltaX * ratio;
    const knobY = deltaY * ratio;

    return {
        knobX,
        knobY,
        moveX: clampAxis(knobX / TOUCH_PAD_RADIUS_PX),
        moveZ: clampAxis(-knobY / TOUCH_PAD_RADIUS_PX),
    };
};

export const TouchControls = () => {
    const paused = useGameplaySessionStore((state) => state.paused);
    const dialogueOpen = usePlayerStore((state) => state.dialogueOpen);
    const isComplete = useLevelStore((state) => state.isComplete);
    const [touchSupported, setTouchSupported] = useState(false);
    const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setTouchSupported(supportsTouchTraversalControls());
    }, []);

    useEffect(() => {
        if (paused || dialogueOpen || isComplete) {
            clearTouchMovementInput();
            setKnobPosition({ x: 0, y: 0 });
        }
    }, [dialogueOpen, isComplete, paused]);

    useEffect(
        () => () => {
            clearTouchMovementInput();
        },
        [],
    );

    if (!touchSupported || paused || dialogueOpen || isComplete) {
        return null;
    }

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-between px-4 lg:hidden">
            <Card tone="muted" className="pointer-events-auto rounded-[1.5rem] bg-ink-950/82 p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-400">Touch Drive</p>
                <div
                    data-testid="touch-movement-pad"
                    className="relative mt-3 size-28 touch-none rounded-full border border-white/12 bg-white/5"
                    onPointerCancel={(event) => {
                        event.currentTarget.releasePointerCapture?.(event.pointerId);
                        clearTouchMovementInput();
                        setKnobPosition({ x: 0, y: 0 });
                    }}
                    onPointerDown={(event) => {
                        event.preventDefault();
                        event.currentTarget.setPointerCapture?.(event.pointerId);
                        const movement = resolveTouchMovement(
                            event.clientX,
                            event.clientY,
                            event.currentTarget.getBoundingClientRect(),
                        );
                        setTouchMovementInput({
                            moveX: movement.moveX,
                            moveZ: movement.moveZ,
                        });
                        setKnobPosition({ x: movement.knobX, y: movement.knobY });
                    }}
                    onPointerMove={(event) => {
                        if ((event.buttons & 1) !== 1) {
                            return;
                        }

                        const movement = resolveTouchMovement(
                            event.clientX,
                            event.clientY,
                            event.currentTarget.getBoundingClientRect(),
                        );
                        setTouchMovementInput({
                            moveX: movement.moveX,
                            moveZ: movement.moveZ,
                        });
                        setKnobPosition({ x: movement.knobX, y: movement.knobY });
                    }}
                    onPointerUp={(event) => {
                        event.currentTarget.releasePointerCapture?.(event.pointerId);
                        clearTouchMovementInput();
                        setKnobPosition({ x: 0, y: 0 });
                    }}
                >
                    <div className="absolute inset-3 rounded-full border border-white/10" />
                    <div
                        className="absolute top-1/2 left-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-400/35 bg-gold-400/18 shadow-[0_0_22px_rgba(233,196,106,0.22)]"
                        style={{
                            transform: `translate(calc(-50% + ${knobPosition.x}px), calc(-50% + ${knobPosition.y}px))`,
                        }}
                    />
                </div>
                <p className="mt-3 max-w-32 text-xs text-sand-100/70">
                    Hold and drag to move. Map gestures are paused during traversal on touch.
                </p>
            </Card>
        </div>
    );
};
