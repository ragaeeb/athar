import { useEffect, useState } from 'react';
import { Link, useLoaderData, useNavigate } from 'react-router-dom';

import type { GameLevelLoaderData } from '@/app/routes/game/level.loader';
import { LEVEL_REGISTRY } from '@/content/levels/registry';
import { audioManager } from '@/features/audio/audio-manager';
import { useAtharDevTools } from '@/features/debug/dev-tools';
import { PlayerController } from '@/features/gameplay/controllers/PlayerController';
import { PresentationRuntime } from '@/features/gameplay/presentation/PresentationRuntime';
import { useGameStore } from '@/features/gameplay/state/game.store';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { GameLoop } from '@/features/gameplay/systems/GameLoop';
import { HUD } from '@/features/hud/components/HUD';
import { LevelMap } from '@/features/map/components/LevelMap';
import { MapRuntimeBoundary } from '@/features/map/components/MapRuntimeBoundary';
import { MapScene } from '@/features/map/components/MapScene';
import type { MapRuntimeIssue } from '@/features/map/lib/runtime-issues';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Overlay } from '@/shared/ui/Overlay';

const LockedLevelView = () => (
    <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-xl rounded-[2rem] bg-ink-950/70 p-8">
            <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Athar</p>
            <h1 className="mt-4 font-display text-4xl text-sand-50">Chapter Locked</h1>
            <p className="mt-4 text-sand-100/75">
                Complete the current playable chapter to unlock the next leg of Athar.
            </p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-gold-400 px-5 py-3 font-semibold text-ink-950">
                Return Home
            </Link>
        </Card>
    </main>
);

const PreviewLevelView = ({ subtitle, teaser }: { subtitle: string; teaser: string }) => (
    <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-2xl rounded-[2rem] bg-ink-950/70 p-8">
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
        </Card>
    </main>
);

export const GameLevelRoute = () => {
    const { level } = useLoaderData() as GameLevelLoaderData;
    const navigate = useNavigate();
    const [mapResetKey, setMapResetKey] = useState(0);
    const [runtimeIssue, setRuntimeIssue] = useState<MapRuntimeIssue | null>(null);
    const unlockedLevels = useGameStore((state) => state.unlockedLevels);
    const hasAccess = unlockedLevels.includes(level.order);
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

    useAtharDevTools(level.id);

    useEffect(() => {
        if (!level.playable || !hasAccess) {
            return;
        }

        useGameStore.getState().startLevel(level.order);
        usePlayerStore.getState().initializePlayer(level.milestones[0]?.coords ?? level.origin, level.origin);
        useLevelStore.getState().initializeLevel(level);
        audioManager.setAmbient(level.ambientCue);

        return () => {
            audioManager.stopAmbient();
        };
    }, [hasAccess, level]);

    useEffect(() => {
        setRuntimeIssue(null);
        setMapResetKey(0);
    }, [level.id]);

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
            <MapRuntimeBoundary
                resetKey={`${level.id}:${mapResetKey}`}
                onRetry={() => {
                    setRuntimeIssue(null);
                    setMapResetKey((value) => value + 1);
                }}
            >
                <MapScene key={`${level.id}:${mapResetKey}`} level={level} onRuntimeIssueChange={setRuntimeIssue}>
                    <PlayerController />
                    <PresentationRuntime origin={level.origin} />
                    <GameLoop />
                    <LevelMap level={level} />
                </MapScene>
            </MapRuntimeBoundary>

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

            {runtimeIssue?.blocking ? (
                <Overlay>
                    <Card tone="reward" className="w-full max-w-xl rounded-[2rem] p-8 text-center">
                        <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Athar</p>
                        <h2 className="mt-4 font-display text-4xl text-sand-50">{runtimeIssue.title}</h2>
                        <p className="mt-4 text-sand-100/75">{runtimeIssue.message}</p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Button
                                onClick={() => {
                                    setRuntimeIssue(null);
                                    setMapResetKey((value) => value + 1);
                                }}
                            >
                                Retry Rendering
                            </Button>
                            <Link
                                to="/"
                                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sand-50"
                            >
                                Return Home
                            </Link>
                        </div>
                    </Card>
                </Overlay>
            ) : null}

            {runtimeIssue && !runtimeIssue.blocking ? (
                <div className="pointer-events-none absolute top-20 right-4 z-20 lg:top-24 lg:right-6">
                    <Card className="pointer-events-auto w-[min(28rem,calc(100vw-2rem))] rounded-[1.5rem] bg-ink-950/92 p-5">
                        <p className="font-mono text-xs uppercase tracking-[0.32em] text-gold-400">Runtime Warning</p>
                        <h2 className="mt-3 font-display text-2xl text-sand-50">{runtimeIssue.title}</h2>
                        <p className="mt-3 text-sm leading-6 text-sand-100/75">{runtimeIssue.message}</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                    setRuntimeIssue(null);
                                    setMapResetKey((value) => value + 1);
                                }}
                            >
                                Retry Map
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setRuntimeIssue(null);
                                }}
                            >
                                Dismiss
                            </Button>
                        </div>
                    </Card>
                </div>
            ) : null}

            {isComplete ? (
                <Overlay>
                    <Card tone="reward" className="w-full max-w-lg rounded-[2rem] p-8 text-center">
                        <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">
                            Chapter Complete
                        </p>
                        <h2 className="mt-4 font-display text-4xl text-sand-50">{level.subtitle}</h2>
                        <p className="mt-4 text-sand-100/75">{level.completionNarration}</p>
                        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                            <Card tone="muted" className="rounded-2xl p-4">
                                <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Hadith</p>
                                <p className="mt-2 font-mono text-2xl text-gold-400">{lockedHadith + currentTokens}</p>
                            </Card>
                            <Card tone="muted" className="rounded-2xl p-4">
                                <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Teachers</p>
                                <p className="mt-2 font-mono text-2xl text-gold-400">{teacherCount}</p>
                            </Card>
                            <Card tone="muted" className="rounded-2xl p-4">
                                <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Milestones</p>
                                <p className="mt-2 font-mono text-2xl text-gold-400">{milestoneCount}</p>
                            </Card>
                        </div>
                        <Button onClick={completeLevel} className="mt-8 px-6">
                            Continue Athar
                        </Button>
                    </Card>
                </Overlay>
            ) : null}
        </main>
    );
};
