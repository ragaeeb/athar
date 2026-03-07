import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { LevelConfig, NextObjective, ObjectiveStatus } from '@/content/levels/types';
import { atharDebugLog } from '@/features/debug/debug';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import {
    directionLabelFromBearing,
    formatDistance,
    headingBetweenCoords,
    worldDistanceInMeters,
} from '@/features/map/lib/geo';

import { DialogueBox } from './DialogueBox';
import { MissionPanel } from './MissionPanel';

type HUDProps = {
    level: LevelConfig;
    objective: NextObjective;
    objectives: ObjectiveStatus[];
    currentTokens: number;
    lockedHadith: number;
    totalVerified: number;
    teacherCount: number;
};

type DrawerProps = {
    side: 'left' | 'right';
    title: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
};

const Drawer = ({ side, title, open, onToggle, children }: DrawerProps) => (
    <div
        className={`pointer-events-auto absolute top-20 z-20 ${
            side === 'left' ? 'left-4 lg:left-6' : 'right-4 lg:right-6'
        }`}
    >
        <div className="flex items-start gap-3">
            {side === 'right' ? null : (
                <button
                    type="button"
                    onClick={onToggle}
                    className="rounded-full border border-white/12 bg-ink-950/75 px-4 py-2 font-mono text-xs uppercase tracking-[0.32em] text-sand-50 shadow-xl backdrop-blur"
                >
                    {open ? 'Hide' : title}
                </button>
            )}

            <AnimatePresence initial={false}>
                {open ? (
                    <motion.div
                        initial={{ opacity: 0, x: side === 'left' ? -24 : 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: side === 'left' ? -24 : 24 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="w-[min(24rem,calc(100vw-3rem))]"
                    >
                        {children}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {side === 'right' ? (
                <button
                    type="button"
                    onClick={onToggle}
                    className="rounded-full border border-white/12 bg-ink-950/75 px-4 py-2 font-mono text-xs uppercase tracking-[0.32em] text-sand-50 shadow-xl backdrop-blur"
                >
                    {open ? 'Hide' : title}
                </button>
            ) : null}
        </div>
    </div>
);

export const HUD = ({
    level,
    objective,
    objectives,
    currentTokens,
    lockedHadith,
    totalVerified,
    teacherCount,
}: HUDProps) => {
    const [missionOpen, setMissionOpen] = useState(false);
    const [progressOpen, setProgressOpen] = useState(false);
    const [playerCoords, setPlayerCoords] = useState(() => usePlayerStore.getState().coords);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            const nextCoords = usePlayerStore.getState().coords;
            setPlayerCoords(nextCoords);
        }, 120);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    const navigation = useMemo(() => {
        if (!objective) {
            return {
                directionLabel: 'north',
                distance: '0 m',
            };
        }

        const distance = worldDistanceInMeters(objective.coords, playerCoords);
        const heading = headingBetweenCoords(playerCoords, objective.coords);
        return {
            directionLabel: directionLabelFromBearing(heading),
            distance: formatDistance(distance),
        };
    }, [objective, playerCoords]);

    useEffect(() => {
        atharDebugLog(
            'hud',
            'navigation-update',
            {
                currentTokens,
                direction: navigation.directionLabel,
                distance: navigation.distance,
                lockedHadith,
                objective: objective ? ('name' in objective ? objective.name : objective.label) : null,
                teacherCount,
            },
            { throttleMs: 180 },
        );
    }, [currentTokens, lockedHadith, navigation.directionLabel, navigation.distance, objective, teacherCount]);

    return (
        <>
            <div className="pointer-events-none absolute top-4 left-24 z-20 right-4 flex justify-center lg:top-6 lg:left-32 lg:right-32">
                <div className="pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-ink-950/92 px-4 py-3 shadow-2xl">
                    <div className="min-w-0">
                        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold-400">{level.name}</p>
                        <p className="truncate font-display text-lg text-sand-50">{level.subtitle}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-sand-50">
                            {lockedHadith + currentTokens}/{level.winCondition.requiredHadith} hadith
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-sand-50">
                            {teacherCount}/{level.winCondition.requiredTeachers.length} teachers
                        </div>
                        <div className="rounded-full border border-gold-400/25 bg-gold-400/10 px-3 py-1.5 text-sm text-gold-300">
                            {objective ? `${navigation.directionLabel} ${navigation.distance}` : 'Route complete'}
                        </div>
                    </div>
                </div>
            </div>

            <Drawer
                side="left"
                title="Progress"
                open={progressOpen}
                onToggle={() => setProgressOpen((value) => !value)}
            >
                <div className="rounded-[1.75rem] border border-white/10 bg-ink-950/78 p-5 shadow-2xl backdrop-blur">
                    <p className="font-mono text-xs uppercase tracking-[0.32em] text-gold-400">Progress</p>
                    <div className="mt-4 grid gap-3">
                        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Hadith</p>
                            <p className="mt-2 font-mono text-3xl text-gold-400">
                                {lockedHadith + currentTokens}/{level.winCondition.requiredHadith}
                            </p>
                            <p className="mt-2 text-sm text-sand-100/75">
                                Carrying {currentTokens} unverified, preserved total {totalVerified}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Teachers</p>
                            <p className="mt-2 text-2xl font-semibold text-sand-50">
                                {teacherCount}/{level.winCondition.requiredTeachers.length}
                            </p>
                            <p className="mt-2 text-sm text-sand-100/75">Required scholar encounters completed</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Controls</p>
                            <p className="mt-2 text-sm text-sand-100/85">Move with `WASD` or arrow keys.</p>
                        </div>
                    </div>
                </div>
            </Drawer>

            <Drawer
                side="right"
                title="Objectives"
                open={missionOpen}
                onToggle={() => setMissionOpen((value) => !value)}
            >
                <div className="flex flex-col gap-3">
                    <MissionPanel level={level} objectives={objectives} />
                    <div className="rounded-[1.75rem] border border-white/10 bg-ink-950/78 p-5 shadow-2xl backdrop-blur">
                        <p className="font-mono text-xs uppercase tracking-[0.32em] text-gold-400">Route</p>
                        {objective ? (
                            <>
                                <p className="mt-3 font-semibold text-sand-50">
                                    {'name' in objective ? objective.name : objective.label}
                                </p>
                                <p className="mt-1 text-sm text-sand-100/75">
                                    Head {navigation.directionLabel} toward{' '}
                                    {'name' in objective ? objective.name : objective.label}
                                </p>
                                <p className="mt-2 font-mono text-sm text-gold-400">{navigation.distance}</p>
                            </>
                        ) : (
                            <p className="mt-3 text-sm text-sand-100/75">All visible objectives are complete.</p>
                        )}
                    </div>
                </div>
            </Drawer>

            <DialogueBox />
        </>
    );
};
