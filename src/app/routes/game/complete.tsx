import { Link } from 'react-router-dom';

import { DEFAULT_LEVEL_COMPLETION_CONTENT } from '@/content/levels/completion-content';
import { getLevelById } from '@/content/levels/registry';
import { useGameStore } from '@/features/gameplay/state/game.store';
import { getButtonClassName } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';

export const LevelCompleteRoute = () => {
    const summary = useGameStore((state) => state.lastCompletion);
    const totalHadithVerified = useGameStore((state) => state.totalHadithVerified);
    const unlockedLevels = useGameStore((state) => state.unlockedLevels);
    const verifiedHadithByLevel = useGameStore((state) => state.verifiedHadithByLevel);

    if (!summary) {
        return (
            <main className="flex min-h-screen items-center justify-center p-6">
                <Card className="max-w-xl rounded-[2rem] bg-ink-950/70 p-8">
                    <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Athar</p>
                    <h1 className="mt-4 font-display text-4xl text-sand-50">No Completion Summary</h1>
                    <p className="mt-4 text-sand-100/75">
                        Play a chapter before opening the completion route directly.
                    </p>
                    <Link
                        to="/"
                        className="mt-6 inline-flex rounded-full bg-gold-400 px-5 py-3 font-semibold text-ink-950"
                    >
                        Return Home
                    </Link>
                </Card>
            </main>
        );
    }

    const completedLevel = getLevelById(summary.levelId);
    const completionContent = completedLevel?.completionContent ?? DEFAULT_LEVEL_COMPLETION_CONTENT;
    const nextLevel = completedLevel ? getLevelById(`level-${completedLevel.order + 1}`) : undefined;
    const canOpenNextLevel = nextLevel != null && unlockedLevels.includes(nextLevel.order) && nextLevel.playable;
    const completedChapterCount = Object.keys(verifiedHadithByLevel).length;

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(233,196,106,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(31,157,149,0.2),transparent_30%)]" />
            <Card tone="reward" className="relative w-full max-w-4xl rounded-[2.5rem] p-8 lg:p-10">
                <p className="font-display text-sm uppercase tracking-[0.5em] text-gold-400">
                    {completionContent.eyebrow}
                </p>
                <h1 className="mt-4 font-display text-4xl text-sand-50 lg:text-5xl">{summary.levelSubtitle}</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-sand-100/75" dir="auto">
                    {summary.completionNarration}
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-4">
                    <Card tone="muted" className="rounded-[1.5rem] p-5">
                        <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Chapter Verified</p>
                        <p className="mt-2 font-mono text-3xl text-gold-400">{summary.verifiedHadith}</p>
                    </Card>
                    <Card tone="muted" className="rounded-[1.5rem] p-5">
                        <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Teachers</p>
                        <p className="mt-2 font-mono text-3xl text-gold-400">{summary.teachersMet}</p>
                    </Card>
                    <Card tone="muted" className="rounded-[1.5rem] p-5">
                        <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Time</p>
                        <p className="mt-2 font-mono text-3xl text-gold-400">{summary.timeTakenSeconds}s</p>
                    </Card>
                    <Card tone="muted" className="rounded-[1.5rem] p-5">
                        <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Tokens Lost</p>
                        <p className="mt-2 font-mono text-3xl text-gold-400">{summary.tokensLost}</p>
                    </Card>
                </div>

                <Card tone="muted" className="mt-8 rounded-[1.75rem] p-6">
                    <p className="font-display text-lg text-sand-50">{completionContent.historicalNoteTitle}</p>
                    <p className="mt-3 text-base leading-7 text-sand-100/75" dir="auto">
                        {summary.historicalNote}
                    </p>
                </Card>

                {nextLevel ? (
                    <Card tone="muted" className="mt-6 rounded-[1.75rem] p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="max-w-2xl">
                                <p className="font-display text-lg text-sand-50">
                                    {completionContent.nextChapterTitle}
                                </p>
                                <h2 className="mt-3 font-display text-3xl text-sand-50">{nextLevel.subtitle}</h2>
                                <p className="mt-3 text-base leading-7 text-sand-100/75" dir="auto">
                                    {nextLevel.teaser}
                                </p>
                            </div>
                            {!nextLevel.playable ? (
                                <span className="rounded-full border border-gold-400/25 bg-gold-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-gold-300">
                                    Coming Soon
                                </span>
                            ) : null}
                        </div>
                    </Card>
                ) : completedLevel ? (
                    <Card
                        tone="muted"
                        className="mt-6 rounded-[1.75rem] border border-gold-400/18 bg-gold-400/6 p-6"
                        data-testid="legacy-summary-panel"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="max-w-2xl">
                                <p className="font-display text-lg text-gold-200">
                                    {completionContent.nextChapterTitle}
                                </p>
                                <h2 className="mt-3 font-display text-3xl text-sand-50">All Chapters Complete</h2>
                                <p className="mt-3 text-base leading-7 text-sand-100/75" dir="auto">
                                    Athar now holds your best verified totals across the full five-chapter journey.
                                    Replays can still improve any chapter score, but the route itself is complete.
                                </p>
                            </div>
                            <div className="grid min-w-[15rem] gap-3 sm:grid-cols-2">
                                <Card tone="muted" className="rounded-[1.25rem] p-4">
                                    <p className="text-xs uppercase tracking-[0.24em] text-sand-100/55">
                                        Best Verified
                                    </p>
                                    <p className="mt-2 font-mono text-2xl text-gold-300">{totalHadithVerified}</p>
                                </Card>
                                <Card tone="muted" className="rounded-[1.25rem] p-4">
                                    <p className="text-xs uppercase tracking-[0.24em] text-sand-100/55">
                                        Chapters Closed
                                    </p>
                                    <p className="mt-2 font-mono text-2xl text-gold-300">{completedChapterCount}</p>
                                </Card>
                            </div>
                        </div>
                    </Card>
                ) : null}

                <div className="mt-8 flex flex-wrap gap-3">
                    {nextLevel && canOpenNextLevel ? (
                        <Link to={`/game/${nextLevel.id}`} className={getButtonClassName({})}>
                            {completionContent.nextChapterActionLabel}
                        </Link>
                    ) : null}
                    <Link to="/" className={getButtonClassName({ variant: 'secondary' })}>
                        {completionContent.homeActionLabel}
                    </Link>
                </div>
            </Card>
        </main>
    );
};
