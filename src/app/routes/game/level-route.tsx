import { useEffect, useState } from 'react';
import { Link, useLoaderData, useNavigate } from 'react-router-dom';

import { parseGameLevelLoaderData } from '@/app/routes/game/level.loader';
import { LEVEL_REGISTRY } from '@/content/levels/registry';
import type { LevelConfig } from '@/content/levels/types';
import { evictLevelSceneAssets } from '@/content/models/level-scene-assets';
import { audioManager } from '@/features/audio/audio-manager';
import { useAtharDevTools } from '@/features/debug/dev-tools';
import { clearInputState } from '@/features/gameplay/controllers/input-state';
import { PlayerController } from '@/features/gameplay/controllers/PlayerController';
import { TouchControls } from '@/features/gameplay/controllers/TouchControls';
import { PresentationRuntime } from '@/features/gameplay/presentation/PresentationRuntime';
import { useGameStore } from '@/features/gameplay/state/game.store';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { resetGameplaySessionStore, useGameplaySessionStore } from '@/features/gameplay/state/session.store';
import { GameLoop } from '@/features/gameplay/systems/GameLoop';
import { GameplayDefeatOverlay } from '@/features/hud/components/GameplayDefeatOverlay';
import { GameplayPauseOverlay } from '@/features/hud/components/GameplayPauseOverlay';
import { HUD } from '@/features/hud/components/HUD';
import { TraversalOnboarding } from '@/features/hud/components/TraversalOnboarding';
import { LevelMap } from '@/features/map/components/LevelMap';
import { MapRuntimeBoundary } from '@/features/map/components/MapRuntimeBoundary';
import { MapScene } from '@/features/map/components/MapScene';
import type { MapRuntimeIssue } from '@/features/map/lib/runtime-issues';
import { Button, getButtonClassName } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Overlay } from '@/shared/ui/Overlay';

const initializeChapterSession = (level: LevelConfig) => {
    useGameStore.getState().startLevel(level.order);
    usePlayerStore.getState().initializePlayer(level.milestones[0]?.coords ?? level.origin, level.origin);
    useLevelStore.getState().initializeLevel(level);
};

const createChapterSessionSignature = (level: LevelConfig, movementSpeedMultiplier: number) =>
    JSON.stringify({
        hadithTokenClusters: level.hadithTokenClusters,
        id: level.id,
        initialView: level.initialView,
        milestones: level.milestones,
        movementSpeedMultiplier,
        namedAreas: level.namedAreas,
        obstacles: level.obstacles,
        origin: level.origin,
        teachers: level.teachers,
    });

const LockedLevelView = () => (
    <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-xl rounded-[2rem] bg-ink-950/70 p-8">
            <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Athar</p>
            <h1 className="mt-4 font-display text-4xl text-sand-50">Chapter Locked</h1>
            <p className="mt-4 text-sand-100/75">
                Complete the current playable chapter to unlock the next leg of Athar.
            </p>
            <Link to="/" className={getButtonClassName({ className: 'mt-6' })}>
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
                <Link to="/" className={getButtonClassName()}>
                    Return Home
                </Link>
                <Link to="/game/level-1" className={getButtonClassName({ variant: 'secondary' })}>
                    Replay Level 1
                </Link>
            </div>
        </Card>
    </main>
);

const CompletionOverlay = ({ level }: { level: LevelConfig }) => {
    const navigate = useNavigate();
    const isComplete = useLevelStore((state) => state.isComplete);
    const lockedHadith = useLevelStore((state) => state.lockedHadith);
    const currentTokens = usePlayerStore((state) => state.hadithTokens);
    const teacherCount = useLevelStore((state) => state.completedTeacherIds.length);
    const milestoneCount = useLevelStore((state) => state.completedMilestoneIds.length);

    if (!isComplete) {
        return null;
    }

    const completeLevel = () => {
        const carryOver = usePlayerStore.getState().bankTokens();
        if (carryOver > 0) {
            useLevelStore.getState().addLockedHadith(carryOver);
        }

        const verifiedHadith = useLevelStore.getState().lockedHadith;
        const summary = {
            completionNarration: level.completionNarration,
            historicalNote: level.historicalNote,
            levelId: level.id,
            levelName: level.name,
            levelSubtitle: level.subtitle,
            teachersMet: useLevelStore.getState().completedTeacherIds.length,
            timeTakenSeconds: Math.max(1, Math.round((Date.now() - usePlayerStore.getState().startedAt) / 1000)),
            tokensLost: usePlayerStore.getState().tokensLost,
            verifiedHadith,
        };

        const nextLevel = LEVEL_REGISTRY.find((entry) => entry.order === level.order + 1) ?? null;
        useGameStore.getState().recordCompletion(summary, nextLevel?.order ?? null);
        navigate(`/game/${level.id}/complete`);
    };

    return (
        <Overlay>
            <Card tone="reward" className="w-full max-w-lg rounded-[2rem] p-8 text-center">
                <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">
                    {level.completionContent.eyebrow}
                </p>
                <h2 className="mt-4 font-display text-4xl text-sand-50">{level.subtitle}</h2>
                <p className="mt-4 text-sand-100/75" dir="auto">
                    {level.completionNarration}
                </p>
                <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                    <Card tone="muted" className="rounded-2xl p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-sand-100/55">Chapter Verified</p>
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
                    {level.completionContent.reviewActionLabel}
                </Button>
            </Card>
        </Overlay>
    );
};

export const GameLevelRoute = () => {
    const loaderData = useLoaderData();
    const { level, runtimeOverrides } = parseGameLevelLoaderData(loaderData);
    const chapterSessionSignature = createChapterSessionSignature(level, runtimeOverrides.movementSpeedMultiplier);
    const [mapResetKey, setMapResetKey] = useState(0);
    const [sessionResetKey, setSessionResetKey] = useState(0);
    const [runtimeIssue, setRuntimeIssue] = useState<MapRuntimeIssue | null>(null);
    const unlockedLevels = useGameStore((state) => state.unlockedLevels);
    const onboardingDismissed = useGameplaySessionStore((state) => state.onboardingDismissed);
    const paused = useGameplaySessionStore((state) => state.paused);
    const defeat = useGameplaySessionStore((state) => state.defeat);
    const isComplete = useLevelStore((state) => state.isComplete);
    const dialogueOpen = usePlayerStore((state) => state.dialogueOpen);
    const hasAccess = unlockedLevels.includes(level.order);
    const handleRetry = () => {
        setRuntimeIssue(null);
        setMapResetKey((value) => value + 1);
    };
    const handlePauseToggle = () => {
        useGameplaySessionStore.getState().togglePause();
    };
    const handleRestartChapter = () => {
        clearInputState();
        resetGameplaySessionStore();
        initializeChapterSession(level);
        setRuntimeIssue(null);
        setMapResetKey(0);
        setSessionResetKey((value) => value + 1);
    };

    useAtharDevTools(level.id);

    useEffect(() => {
        if (!level.playable || !hasAccess) {
            return;
        }

        const selectedCharacter = useGameStore.getState().selectedCharacter;
        initializeChapterSession(level);
        audioManager.setAmbient(level.ambientCue);
        const warmupTimerId = window.setTimeout(() => {
            audioManager.warmup();
        }, 0);

        return () => {
            window.clearTimeout(warmupTimerId);
            audioManager.disposeAll();
            evictLevelSceneAssets(level, selectedCharacter);
        };
    }, [chapterSessionSignature, hasAccess]);

    useEffect(() => {
        clearInputState();
        resetGameplaySessionStore();
        setRuntimeIssue(null);
        setMapResetKey(0);
        setSessionResetKey(0);
    }, [chapterSessionSignature]);

    useEffect(
        () => () => {
            clearInputState();
            resetGameplaySessionStore();
        },
        [],
    );

    if (!hasAccess) {
        return <LockedLevelView />;
    }

    if (!level.playable) {
        return <PreviewLevelView subtitle={level.subtitle} teaser={level.teaser} />;
    }

    const mapInstanceKey = `${chapterSessionSignature}:${sessionResetKey}:${mapResetKey}`;

    return (
        <main className="relative h-screen w-screen overflow-hidden bg-ink-950">
            <MapRuntimeBoundary resetKey={mapInstanceKey} onRetry={handleRetry}>
                <MapScene key={mapInstanceKey} level={level} onRuntimeIssueChange={setRuntimeIssue}>
                    <PlayerController />
                    <PresentationRuntime origin={level.origin} />
                    <GameLoop movementSpeedMultiplier={runtimeOverrides.movementSpeedMultiplier} />
                    <LevelMap level={level} />
                </MapScene>
            </MapRuntimeBoundary>

            <HUD level={level} />
            <TouchControls />

            <div className="pointer-events-none absolute top-4 left-4 z-20 flex gap-3 lg:top-6 lg:left-6">
                <Link
                    to="/"
                    className={getButtonClassName({
                        className: 'pointer-events-auto bg-ink-950/92 text-sm',
                        size: 'sm',
                        variant: 'secondary',
                    })}
                >
                    Exit Athar
                </Link>
                {!isComplete ? (
                    <Button
                        className="pointer-events-auto bg-ink-950/92 text-sm"
                        onClick={handlePauseToggle}
                        size="sm"
                        variant="secondary"
                    >
                        {paused ? 'Resume Journey' : 'Pause Journey'}
                    </Button>
                ) : null}
            </div>

            {defeat && !runtimeIssue?.blocking && !isComplete ? (
                <GameplayDefeatOverlay defeat={defeat} onRestart={handleRestartChapter} />
            ) : null}

            {paused && !defeat && !runtimeIssue?.blocking && !isComplete ? (
                <GameplayPauseOverlay onRestart={handleRestartChapter} onResume={handlePauseToggle} />
            ) : null}

            {!onboardingDismissed && !paused && !defeat && !runtimeIssue && !isComplete && !dialogueOpen ? (
                <TraversalOnboarding />
            ) : null}

            {runtimeIssue?.blocking ? (
                <Overlay>
                    <Card tone="reward" className="w-full max-w-xl rounded-[2rem] p-8 text-center">
                        <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Athar</p>
                        <h2 className="mt-4 font-display text-4xl text-sand-50">{runtimeIssue.title}</h2>
                        <p className="mt-4 text-sand-100/75">{runtimeIssue.message}</p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Button onClick={handleRetry}>Retry Rendering</Button>
                            <Link to="/" className={getButtonClassName({ variant: 'secondary' })}>
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
                            <Button size="sm" variant="secondary" onClick={handleRetry}>
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

            <CompletionOverlay level={level} />
        </main>
    );
};
