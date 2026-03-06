import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { LevelMap } from '@/components/LevelMap';
import { MapScene } from '@/components/MapScene';
import { CameraController } from '@/game/engine/CameraController';
import { GameLoop } from '@/game/engine/GameLoop';
import { PlayerController } from '@/game/engine/PlayerController';
import { HUD } from '@/game/hud/HUD';
import { getLevelById, LEVEL_REGISTRY } from '@/game/levels';
import { useGameStore } from '@/game/store/game.store';
import { useLevelStore } from '@/game/store/level.store';
import { usePlayerStore } from '@/game/store/player.store';
import { audioManager } from '@/lib/audio';
import { useAtharDevTools } from '@/lib/dev-tools';

const LockedLevelView = () => (
    <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-xl rounded-[2rem] border border-white/10 bg-ink-950/70 p-8 backdrop-blur">
            <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Athar</p>
            <h1 className="mt-4 font-display text-4xl text-sand-50">Chapter Locked</h1>
            <p className="mt-4 text-sand-100/75">
                Complete the current playable chapter to unlock the next leg of Athar.
            </p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-gold-400 px-5 py-3 font-semibold text-ink-950">
                Return Home
            </Link>
        </div>
    </main>
);

const PreviewLevelView = ({ subtitle, teaser }: { subtitle: string; teaser: string }) => (
    <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-2xl rounded-[2rem] border border-white/10 bg-ink-950/70 p-8 backdrop-blur">
            <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Preview Chapter</p>
            <h1 className="mt-4 font-display text-4xl text-sand-50">{subtitle}</h1>
            <p className="mt-4 text-sand-100/75">{teaser}</p>
            <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/" className="inline-flex rounded-full bg-gold-400 px-5 py-3 font-semibold text-ink-950">
                    Return Home
                </Link>
                <Link
                    to="/game/level-1"
                    className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sand-50"
                >
                    Replay Level 1
                </Link>
            </div>
        </div>
    </main>
);

export const GameLevelRoute = () => {
    const { levelId } = useParams();
    const navigate = useNavigate();
    const level = useMemo(() => (levelId ? getLevelById(levelId) : null), [levelId]);
    const unlockedLevels = useGameStore((state) => state.unlockedLevels);
    const totalVerified = useGameStore((state) => state.totalHadithVerified);
    const teacherCount = useLevelStore((state) => state.completedTeacherIds.length);
    const milestoneCount = useLevelStore((state) => state.completedMilestoneIds.length);
    const lockedHadith = useLevelStore((state) => state.lockedHadith);
    const objectives = useLevelStore((state) => state.objectives);
    const objective = useLevelStore((state) => state.nextObjective);
    const isComplete = useLevelStore((state) => state.isComplete);
    const currentTokens = usePlayerStore((state) => state.hadithTokens);
    const tokensLost = usePlayerStore((state) => state.tokensLost);
    const startedAt = usePlayerStore((state) => state.startedAt);

    useAtharDevTools(levelId);

    useEffect(() => {
        if (!level || !level.playable) {
            return;
        }

        useGameStore.getState().startLevel(level.order);
        usePlayerStore.getState().initializePlayer(level.milestones[0]?.coords ?? level.origin, level.origin);
        useLevelStore.getState().initializeLevel(level);
        audioManager.setAmbient(level.ambientCue);

        return () => {
            audioManager.stopAmbient();
        };
    }, [level]);

    if (!level) {
        return <LockedLevelView />;
    }

    const hasAccess = unlockedLevels.includes(level.order);
    if (!hasAccess) {
        return <LockedLevelView />;
    }

    if (!level.playable) {
        return <PreviewLevelView subtitle={level.subtitle} teaser={level.teaser} />;
    }

    const completeLevel = () => {
        const carryOver = usePlayerStore.getState().bankTokens();
        if (carryOver > 0) {
            useLevelStore.getState().addLockedHadith(carryOver);
            useGameStore.getState().addVerifiedHadith(carryOver);
        }

        const verifiedHadith = useLevelStore.getState().lockedHadith;
        const summary = {
            completionNarration: level.completionNarration,
            historicalNote: level.historicalNote,
            levelId: level.id,
            levelName: level.name,
            levelSubtitle: level.subtitle,
            teachersMet: teacherCount,
            timeTakenSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
            tokensLost,
            verifiedHadith,
        };

        const nextLevel = LEVEL_REGISTRY.find((entry) => entry.order === level.order + 1) ?? null;
        useGameStore.getState().recordCompletion(summary, nextLevel?.order ?? null);
        navigate(`/game/${level.id}/complete`);
    };

    return (
        <main className="relative h-screen w-screen overflow-hidden bg-ink-950">
            <MapScene level={level}>
                <PlayerController />
                <CameraController />
                <GameLoop />
                <LevelMap level={level} />
            </MapScene>

            <HUD
                level={level}
                objective={objective}
                objectives={objectives}
                currentTokens={currentTokens}
                lockedHadith={lockedHadith}
                totalVerified={totalVerified}
                teacherCount={teacherCount}
            />

            <div className="pointer-events-none absolute top-4 left-4 z-20 flex gap-3 lg:top-6 lg:left-6">
                <Link
                    to="/"
                    className="pointer-events-auto rounded-full border border-white/15 bg-ink-950/92 px-4 py-2 text-sm text-sand-50"
                >
                    Exit Athar
                </Link>
            </div>

            {isComplete ? (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink-950/80 p-4">
                    <div className="w-full max-w-lg rounded-[2rem] border border-gold-400/25 bg-ink-950/85 p-8 text-center shadow-2xl">
                        <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">
                            Chapter Complete
                        </p>
                        <h2 className="mt-4 font-display text-4xl text-sand-50">{level.subtitle}</h2>
                        <p className="mt-4 text-sand-100/75">{level.completionNarration}</p>
                        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                                <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Hadith</p>
                                <p className="mt-2 font-mono text-2xl text-gold-400">{lockedHadith + currentTokens}</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                                <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Teachers</p>
                                <p className="mt-2 font-mono text-2xl text-gold-400">{teacherCount}</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                                <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Milestones</p>
                                <p className="mt-2 font-mono text-2xl text-gold-400">{milestoneCount}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={completeLevel}
                            className="mt-8 rounded-full bg-gold-400 px-6 py-3 font-semibold text-ink-950"
                        >
                            Continue Athar
                        </button>
                    </div>
                </div>
            ) : null}
        </main>
    );
};
