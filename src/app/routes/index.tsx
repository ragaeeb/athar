import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { LEVEL_REGISTRY } from '@/content/levels/registry';
import { CharacterSelect } from '@/features/characters/components/CharacterSelect';
import { useGameStore } from '@/features/gameplay/state/game.store';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';

export const IndexRoute = () => {
    const navigate = useNavigate();
    const selectedCharacter = useGameStore((state) => state.selectedCharacter);
    const unlockedLevels = useGameStore((state) => state.unlockedLevels);
    const totalHadithVerified = useGameStore((state) => state.totalHadithVerified);
    const selectCharacter = useGameStore((state) => state.selectCharacter);
    const startLevel = useGameStore((state) => state.startLevel);

    const selectedScholarName = CHARACTER_CONFIGS[selectedCharacter].name;

    const playChapter = (levelId: string, levelOrder: number) => {
        startLevel(levelOrder);
        navigate(`/game/${levelId}`);
    };

    const onStartAthar = () => {
        playChapter('level-1', 1);
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
                    <Card className="rounded-[2rem] bg-ink-950/65 p-8">
                        <p className="font-display text-sm uppercase tracking-[0.5em] text-gold-400">Athar</p>
                        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-sand-50 md:text-6xl">
                            Cross the classical Islamic world and preserve knowledge before it is lost.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-sand-100/75">
                            This implementation now ships two playable desktop chapters: a character-select title
                            screen, sequential map routes, scholar encounters, losable hadith tokens, and a
                            chapter-specific completion flow.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Button onClick={onStartAthar} className="px-6">
                                Begin Level 1
                            </Button>
                            <Button
                                onClick={() => {
                                    useGameStore.getState().resetProgress();
                                }}
                                className="px-6"
                                variant="secondary"
                            >
                                Reset Progress
                            </Button>
                        </div>
                    </Card>

                    <Card className="rounded-[2rem] bg-white/5 p-8">
                        <p className="font-mono text-xs uppercase tracking-[0.35em] text-sand-100/55">
                            Progress Ledger
                        </p>
                        <div className="mt-4 space-y-4">
                            <Card tone="muted" className="rounded-2xl bg-ink-950/45 p-4">
                                <p className="text-sm text-sand-100/60">Verified hadith across completed runs</p>
                                <p className="mt-2 font-mono text-3xl font-bold text-gold-400">{totalHadithVerified}</p>
                            </Card>
                            <Card tone="muted" className="rounded-2xl bg-ink-950/45 p-4">
                                <p className="text-sm text-sand-100/60">Unlocked chapters</p>
                                <p className="mt-2 text-2xl font-semibold text-sand-50">{unlockedLevels.join(', ')}</p>
                            </Card>
                            <Card tone="muted" className="rounded-2xl bg-ink-950/45 p-4">
                                <p className="text-sm text-sand-100/60">Current scholar</p>
                                <p className="mt-2 text-2xl font-semibold text-sand-50">{selectedScholarName}</p>
                            </Card>
                        </div>
                    </Card>
                </motion.section>

                <Card className="rounded-[2rem] bg-ink-950/55 p-6 lg:p-8">
                    <div className="mb-6 flex flex-col gap-2">
                        <p className="font-mono text-xs uppercase tracking-[0.35em] text-sand-100/55">Scholar Select</p>
                        <h2 className="font-display text-3xl text-sand-50">Choose your hadith scholar</h2>
                    </div>
                    <CharacterSelect value={selectedCharacter} onChange={selectCharacter} />
                </Card>

                <Card className="rounded-[2rem] bg-ink-950/55 p-6 lg:p-8">
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
                                    {level.playable && unlocked ? (
                                        <Button
                                            className="mt-4"
                                            onClick={() => playChapter(level.id, level.order)}
                                            size="sm"
                                            variant={level.order === 1 ? 'primary' : 'secondary'}
                                        >
                                            {`Play Chapter ${level.order}`}
                                        </Button>
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </main>
    );
};
