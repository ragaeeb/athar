import { motion } from 'framer-motion';
import { useEffect, useId, useRef } from 'react';
import { audioManager } from '@/features/audio/audio-manager';
import { atharDebugLog } from '@/features/debug/debug';
import { beginSpikeWatch } from '@/features/debug/spike-watch';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Scrim } from '@/shared/ui/Scrim';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const getFocusableElements = (root: HTMLDivElement) =>
    [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter((element) => !element.hasAttribute('disabled'));

const handleDialogueKeyDown = (event: KeyboardEvent, root: HTMLDivElement | null) => {
    if (event.key === 'Escape') {
        usePlayerStore.getState().closeDialogue();
        return;
    }

    if (event.key !== 'Tab' || !root) {
        return;
    }

    const focusableElements = getFocusableElements(root);
    if (focusableElements.length === 0) {
        return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
        return;
    }

    if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
    }
};

export const DialogueBox = () => {
    const teacher = usePlayerStore((state) => state.activeTeacher);
    const dialogueOpen = usePlayerStore((state) => state.dialogueOpen);
    const currentTokens = usePlayerStore((state) => state.hadithTokens);
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const primaryButtonRef = useRef<HTMLButtonElement | null>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!teacher || !dialogueOpen) {
            return;
        }

        previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        primaryButtonRef.current?.focus();

        const onKeyDown = (event: KeyboardEvent) => handleDialogueKeyDown(event, dialogRef.current);

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            previousFocusRef.current?.focus();
        };
    }, [dialogueOpen, teacher]);

    if (!teacher || !dialogueOpen) {
        return null;
    }

    const runDialogueAction = (action: 'continue-athar' | 'receive-hadith', callback: () => void) => {
        const startedAtMs = performance.now();
        beginSpikeWatch(`dialogue:${action}:${teacher.id}`);
        callback();

        const durationMs = performance.now() - startedAtMs;
        atharDebugLog('hud', 'DIALOGUE_ACTION', { action, durationMs, teacherId: teacher.id });
        if (durationMs > 8) {
            atharDebugLog('hud', 'DIALOGUE_ACTION_SPIKE', { action, durationMs, teacherId: teacher.id });
        }
    };

    const onReceiveHadith = () => {
        runDialogueAction('receive-hadith', () => {
            const bankedTokens = usePlayerStore.getState().bankTokens();
            useLevelStore.getState().addLockedHadith(bankedTokens);
            useLevelStore.getState().completeTeacher(teacher.id);
            usePlayerStore.getState().closeDialogue();
            audioManager.play('receive-hadith');
        });
    };

    return (
        <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto absolute inset-0 flex items-center justify-center p-4"
        >
            <Scrim />
            <div
                ref={dialogRef}
                className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-gold-400/25 bg-[#1a1410]/90 p-7 shadow-2xl"
            >
                <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">{teacher.city}</p>
                <h2 id={titleId} className="mt-3 font-dialogue text-4xl text-sand-50">
                    {teacher.name}
                </h2>
                <p className="mt-2 text-sm uppercase tracking-[0.3em] text-sand-100/60">{teacher.title}</p>
                <Card tone="muted" className="mt-6 rounded-[1.5rem] bg-sand-50/8 p-5">
                    <p className="font-dialogue text-2xl leading-10 text-sand-50" dir="auto">
                        {teacher.hadith}
                    </p>
                    <p className="mt-4 text-sm text-sand-100/70" dir="auto">
                        {teacher.hadithSource}
                    </p>
                </Card>
                <p className="mt-4 text-sm text-sand-100/75" dir="auto">
                    Receive hadith now to preserve {currentTokens} carried tokens into this chapter's tally.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button ref={primaryButtonRef} onClick={onReceiveHadith}>
                        Receive Hadith
                    </Button>
                    <Button
                        onClick={() => {
                            runDialogueAction('continue-athar', () => {
                                useLevelStore.getState().completeTeacher(teacher.id);
                                usePlayerStore.getState().closeDialogue();
                            });
                        }}
                        variant="secondary"
                    >
                        Continue Athar
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};
