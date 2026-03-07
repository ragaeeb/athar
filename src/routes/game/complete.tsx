import { Link } from 'react-router-dom';

import { getLevelById } from '@/game/levels';
import { useGameStore } from '@/game/store/game.store';

export const LevelCompleteRoute = () => {
    const summary = useGameStore((state) => state.lastCompletion);
    const unlockedLevels = useGameStore((state) => state.unlockedLevels);

    if (!summary) {
        return (
            <main className="flex min-h-screen items-center justify-center p-6">
                <div className="max-w-xl rounded-[2rem] border border-white/10 bg-ink-950/70 p-8 backdrop-blur">
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
                </div>
            </main>
        );
    }

    const completedLevel = getLevelById(summary.levelId);
    const nextLevel = completedLevel
        ? unlockedLevels
              .map((order) => getLevelById(`level-${order}`))
              .find((level) => level?.order === completedLevel.order + 1 && level.playable)
        : undefined;

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(233,196,106,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(31,157,149,0.2),transparent_30%)]" />
            <div className="relative w-full max-w-4xl rounded-[2.5rem] border border-gold-400/20 bg-[#0c161d]/85 p-8 shadow-2xl backdrop-blur lg:p-10">
                <p className="font-display text-sm uppercase tracking-[0.5em] text-gold-400">Chapter Complete</p>
                <h1 className="mt-4 font-display text-4xl text-sand-50 lg:text-5xl">{summary.levelSubtitle}</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-sand-100/75">{summary.completionNarration}</p>

                <div className="mt-8 grid gap-4 md:grid-cols-4">
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
                        <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Verified Hadith</p>
                        <p className="mt-2 font-mono text-3xl text-gold-400">{summary.verifiedHadith}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
                        <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Teachers</p>
                        <p className="mt-2 font-mono text-3xl text-gold-400">{summary.teachersMet}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
                        <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Time</p>
                        <p className="mt-2 font-mono text-3xl text-gold-400">{summary.timeTakenSeconds}s</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
                        <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Tokens Lost</p>
                        <p className="mt-2 font-mono text-3xl text-gold-400">{summary.tokensLost}</p>
                    </div>
                </div>

                <div className="mt-8 rounded-[1.75rem] border border-white/8 bg-white/4 p-6">
                    <p className="font-display text-lg text-sand-50">Historical Note</p>
                    <p className="mt-3 text-base leading-7 text-sand-100/75">{summary.historicalNote}</p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    {nextLevel ? (
                        <Link
                            to={`/game/${nextLevel.id}`}
                            className="rounded-full bg-gold-400 px-6 py-3 font-semibold text-ink-950"
                        >
                            Continue Athar
                        </Link>
                    ) : null}
                    <Link to="/" className="rounded-full border border-white/15 px-6 py-3 text-sand-50">
                        Return Home
                    </Link>
                </div>
            </div>
        </main>
    );
};
