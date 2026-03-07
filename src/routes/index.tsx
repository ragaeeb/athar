import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { CharacterSelect } from '@/components/CharacterSelect';
import { LEVEL_REGISTRY } from '@/game/levels';
import { useGameStore } from '@/game/store/game.store';
import { CHARACTER_CONFIGS } from '@/lib/constants';

export const IndexRoute = () => {
    const navigate = useNavigate();
    const selectedCharacter = useGameStore((state) => state.selectedCharacter);
    const unlockedLevels = useGameStore((state) => state.unlockedLevels);
    const totalHadithVerified = useGameStore((state) => state.totalHadithVerified);
    const selectCharacter = useGameStore((state) => state.selectCharacter);
    const startLevel = useGameStore((state) => state.startLevel);

    const selectedScholarName = CHARACTER_CONFIGS[selectedCharacter].name;

    const onStartAthar = () => {
        startLevel(1);
        navigate('/game/level-1');
    };

    return (
        <main className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,157,149,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(233,196,106,0.16),transparent_28%)]" />
            <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-4 py-8 lg:px-8 lg:py-10">
                <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]"
                >
                    <div className="rounded-[2rem] border border-white/10 bg-ink-950/65 p-8 shadow-2xl backdrop-blur">
                        <p className="font-display text-sm uppercase tracking-[0.5em] text-gold-400">Athar</p>
                        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-sand-50 md:text-6xl">
                            Cross the classical Islamic world and preserve knowledge before it is lost.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-sand-100/75">
                            This first implementation ships a full desktop vertical slice: a character-select title
                            screen, one playable map chapter, scholar encounters, losable hadith tokens, and a level
                            completion flow.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <button
                                type="button"
                                onClick={onStartAthar}
                                className="rounded-full bg-gold-400 px-6 py-3 font-semibold text-ink-950"
                            >
                                Begin Level 1
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    useGameStore.getState().resetProgress();
                                }}
                                className="rounded-full border border-white/15 px-6 py-3 text-sand-50"
                            >
                                Reset Progress
                            </button>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
                        <p className="font-mono text-xs uppercase tracking-[0.35em] text-sand-100/55">
                            Progress Ledger
                        </p>
                        <div className="mt-4 space-y-4">
                            <div className="rounded-2xl border border-white/8 bg-ink-950/45 p-4">
                                <p className="text-sm text-sand-100/60">Verified hadith across completed runs</p>
                                <p className="mt-2 font-mono text-3xl font-bold text-gold-400">{totalHadithVerified}</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-ink-950/45 p-4">
                                <p className="text-sm text-sand-100/60">Unlocked chapters</p>
                                <p className="mt-2 text-2xl font-semibold text-sand-50">{unlockedLevels.join(', ')}</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-ink-950/45 p-4">
                                <p className="text-sm text-sand-100/60">Current scholar</p>
                                <p className="mt-2 text-2xl font-semibold text-sand-50">{selectedScholarName}</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <section className="rounded-[2rem] border border-white/10 bg-ink-950/55 p-6 shadow-2xl backdrop-blur lg:p-8">
                    <div className="mb-6 flex flex-col gap-2">
                        <p className="font-mono text-xs uppercase tracking-[0.35em] text-sand-100/55">Scholar Select</p>
                        <h2 className="font-display text-3xl text-sand-50">Choose your hadith scholar</h2>
                    </div>
                    <CharacterSelect value={selectedCharacter} onChange={selectCharacter} />
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-ink-950/55 p-6 shadow-2xl backdrop-blur lg:p-8">
                    <div className="mb-6 flex flex-col gap-2">
                        <p className="font-mono text-xs uppercase tracking-[0.35em] text-sand-100/55">Athar Chapters</p>
                        <h2 className="font-display text-3xl text-sand-50">Roadmap and current implementation state</h2>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-5">
                        {LEVEL_REGISTRY.map((level) => {
                            const unlocked = unlockedLevels.includes(level.order);
                            return (
                                <article
                                    key={level.id}
                                    className={`rounded-[1.5rem] border p-5 ${
                                        level.playable
                                            ? 'border-gold-400/40 bg-gold-400/8'
                                            : unlocked
                                              ? 'border-white/15 bg-white/5'
                                              : 'border-white/8 bg-white/3 opacity-70'
                                    }`}
                                >
                                    <p className="font-mono text-xs uppercase tracking-[0.35em] text-sand-100/50">
                                        {level.name}
                                    </p>
                                    <h3 className="mt-3 font-display text-xl text-sand-50">{level.subtitle}</h3>
                                    <p className="mt-3 text-sm leading-6 text-sand-100/70">{level.teaser}</p>
                                </article>
                            );
                        })}
                    </div>
                </section>
            </div>
        </main>
    );
};
