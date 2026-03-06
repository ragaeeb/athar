import { motion } from 'framer-motion';
import { useGameStore } from '@/game/store/game.store';
import { useLevelStore } from '@/game/store/level.store';
import { usePlayerStore } from '@/game/store/player.store';
import { audioManager } from '@/lib/audio';

export const DialogueBox = () => {
    const teacher = usePlayerStore((state) => state.activeTeacher);
    const dialogueOpen = usePlayerStore((state) => state.dialogueOpen);
    const currentTokens = usePlayerStore((state) => state.hadithTokens);

    if (!teacher || !dialogueOpen) {
        return null;
    }

    const onReceiveHadith = () => {
        const bankedTokens = usePlayerStore.getState().bankTokens();
        useLevelStore.getState().addLockedHadith(bankedTokens);
        useLevelStore.getState().completeTeacher(teacher.id);
        useGameStore.getState().addVerifiedHadith(bankedTokens);
        usePlayerStore.getState().closeDialogue();
        audioManager.play('receive-hadith');
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-ink-950/80 p-4"
        >
            <div className="w-full max-w-2xl rounded-[2rem] border border-gold-400/25 bg-[#1a1410]/90 p-7 shadow-2xl">
                <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">{teacher.city}</p>
                <h2 className="mt-3 font-dialogue text-4xl text-sand-50">{teacher.name}</h2>
                <p className="mt-2 text-sm uppercase tracking-[0.3em] text-sand-100/60">{teacher.title}</p>
                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-sand-50/8 p-5">
                    <p className="font-dialogue text-2xl leading-10 text-sand-50">{teacher.hadith}</p>
                    <p className="mt-4 text-sm text-sand-100/70">{teacher.hadithSource}</p>
                </div>
                <p className="mt-4 text-sm text-sand-100/75">
                    Receive hadith now to preserve {currentTokens} carried tokens into your verified tally.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={onReceiveHadith}
                        className="rounded-full bg-gold-400 px-5 py-3 font-semibold text-ink-950"
                    >
                        Receive Hadith
                    </button>
                    <button
                        type="button"
                        onClick={() => usePlayerStore.getState().closeDialogue()}
                        className="rounded-full border border-white/15 px-5 py-3 text-sand-50"
                    >
                        Continue Athar
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
