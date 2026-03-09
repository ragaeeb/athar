import { AnimatePresence, motion } from 'framer-motion';
import { memo, startTransition, useEffect, useId, useState } from 'react';
import type { LevelConfig, NextObjective, ObjectiveStatus } from '@/content/levels/types';
import { atharDebugLog } from '@/features/debug/debug';
import { getPlayerRuntimeState } from '@/features/gameplay/runtime/player-runtime';
import { useGameStore } from '@/features/gameplay/state/game.store';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import {
    resolveHadithFeedbackTone,
    resolveObjectiveFeedbackTone,
    resolveTeacherFeedbackTone,
} from '@/features/hud/lib/traversal-feedback';
import {
    directionLabelFromBearing,
    formatDistance,
    headingBetweenCoords,
    worldDistanceInMeters,
} from '@/features/map/lib/geo';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { DrawerPanel } from '@/shared/ui/DrawerPanel';

import { DialogueBox } from './DialogueBox';
import { MissionPanel } from './MissionPanel';
import { NavigationLegend } from './NavigationLegend';

const NAVIGATION_SAMPLE_INTERVAL_MS = 180;

type HUDProps = {
    level: LevelConfig;
};

type DrawerProps = {
    side: 'left' | 'right';
    title: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
};

type DrawerToggleButtonProps = {
    drawerContentId: string;
    onToggle: () => void;
    open: boolean;
    title: string;
};

type NavigationStatus = {
    directionLabel: string;
    distance: string;
};

type NavigationTopBarProps = {
    currentTokens: number;
    level: LevelConfig;
    lockedHadith: number;
    objective: NextObjective;
    teacherCount: number;
};

type ObjectivesDrawerContentProps = {
    level: LevelConfig;
    objective: NextObjective;
    objectives: ObjectiveStatus[];
};

const resolveNavigationStatus = (objective: NextObjective): NavigationStatus => {
    if (!objective) {
        return {
            directionLabel: 'north',
            distance: '0 m',
        };
    }

    const playerCoords = getPlayerRuntimeState().coords;
    const distance = worldDistanceInMeters(objective.coords, playerCoords);
    const heading = headingBetweenCoords(playerCoords, objective.coords);

    return {
        directionLabel: directionLabelFromBearing(heading),
        distance: formatDistance(distance),
    };
};

const navigationStatusesMatch = (left: NavigationStatus, right: NavigationStatus) =>
    left.directionLabel === right.directionLabel && left.distance === right.distance;

const useNavigationStatus = (objective: NextObjective) => {
    const [navigation, setNavigation] = useState(() => resolveNavigationStatus(objective));

    useEffect(() => {
        setNavigation(resolveNavigationStatus(objective));

        const intervalId = window.setInterval(() => {
            const nextNavigation = resolveNavigationStatus(objective);
            startTransition(() => {
                setNavigation((currentNavigation) =>
                    navigationStatusesMatch(currentNavigation, nextNavigation) ? currentNavigation : nextNavigation,
                );
            });
        }, NAVIGATION_SAMPLE_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [objective]);

    return navigation;
};

const DrawerToggleButton = ({ drawerContentId, onToggle, open, title }: DrawerToggleButtonProps) => (
    <Button
        aria-controls={drawerContentId}
        aria-expanded={open}
        aria-label={`${open ? 'Hide' : 'Show'} ${title}`}
        onClick={onToggle}
        size="sm"
        variant="secondary"
        className="font-mono text-xs uppercase tracking-[0.32em]"
    >
        {open ? 'Hide' : title}
    </Button>
);

const Drawer = ({ side, title, open, onToggle, children }: DrawerProps) => {
    const drawerContentId = useId();
    const isLeftDrawer = side === 'left';
    const drawerOffsetX = isLeftDrawer ? -24 : 24;

    return (
        <div
            className={`pointer-events-auto absolute top-20 z-20 ${isLeftDrawer ? 'left-4 lg:left-6' : 'right-4 lg:right-6'}`}
        >
            <div className="flex items-start gap-3">
                {isLeftDrawer ? (
                    <DrawerToggleButton
                        drawerContentId={drawerContentId}
                        onToggle={onToggle}
                        open={open}
                        title={title}
                    />
                ) : null}

                <AnimatePresence initial={false}>
                    {open ? (
                        <motion.div
                            id={drawerContentId}
                            initial={{ opacity: 0, x: drawerOffsetX }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: drawerOffsetX }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="w-[min(24rem,calc(100vw-3rem))]"
                        >
                            {children}
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                {isLeftDrawer ? null : (
                    <DrawerToggleButton
                        drawerContentId={drawerContentId}
                        onToggle={onToggle}
                        open={open}
                        title={title}
                    />
                )}
            </div>
        </div>
    );
};

const NavigationTopBar = memo(
    ({ currentTokens, level, lockedHadith, objective, teacherCount }: NavigationTopBarProps) => {
        const navigation = useNavigationStatus(objective);
        const objectiveDistanceMeters = objective
            ? worldDistanceInMeters(objective.coords, getPlayerRuntimeState().coords)
            : 0;

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
            <div className="pointer-events-none absolute top-4 left-24 z-20 right-4 flex justify-center lg:top-6 lg:left-32 lg:right-32">
                <Card className="pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-full bg-ink-950/92 px-4 py-3">
                    <div className="min-w-0">
                        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold-400">{level.name}</p>
                        <p className="truncate font-display text-lg text-sand-50">{level.subtitle}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Chip
                            tone={resolveHadithFeedbackTone(
                                lockedHadith + currentTokens,
                                level.winCondition.requiredHadith,
                            )}
                        >
                            {lockedHadith + currentTokens}/{level.winCondition.requiredHadith} hadith
                        </Chip>
                        <Chip
                            tone={resolveTeacherFeedbackTone(teacherCount, level.winCondition.requiredTeachers.length)}
                        >
                            {teacherCount}/{level.winCondition.requiredTeachers.length} teachers
                        </Chip>
                        <Chip tone={resolveObjectiveFeedbackTone(Boolean(objective), objectiveDistanceMeters)}>
                            {objective ? `${navigation.directionLabel} ${navigation.distance}` : 'Route complete'}
                        </Chip>
                    </div>
                </Card>
            </div>
        );
    },
);

const ObjectivesDrawerContent = memo(({ level, objective, objectives }: ObjectivesDrawerContentProps) => {
    const navigation = useNavigationStatus(objective);

    return (
        <div className="flex flex-col gap-3">
            <MissionPanel level={level} objectives={objectives} />
            <DrawerPanel className="bg-ink-950/78">
                <NavigationLegend
                    objective={objective}
                    directionLabel={navigation.directionLabel}
                    distance={navigation.distance}
                />
            </DrawerPanel>
        </div>
    );
});

export const HUD = ({ level }: HUDProps) => {
    const objective = useLevelStore((state) => state.nextObjective);
    const objectives = useLevelStore((state) => state.objectives);
    const currentTokens = usePlayerStore((state) => state.hadithTokens);
    const lockedHadith = useLevelStore((state) => state.lockedHadith);
    const totalVerified = useGameStore((state) => state.totalHadithVerified);
    const teacherCount = useLevelStore((state) => state.completedTeacherIds.length);
    const [missionOpen, setMissionOpen] = useState(false);
    const [progressOpen, setProgressOpen] = useState(false);

    return (
        <>
            <NavigationTopBar
                currentTokens={currentTokens}
                level={level}
                lockedHadith={lockedHadith}
                objective={objective}
                teacherCount={teacherCount}
            />

            <Drawer
                side="left"
                title="Progress"
                open={progressOpen}
                onToggle={() => setProgressOpen((value) => !value)}
            >
                <DrawerPanel className="bg-ink-950/78">
                    <p className="font-mono text-xs uppercase tracking-[0.32em] text-gold-400">Progress</p>
                    <div className="mt-4 grid gap-3">
                        <Card tone="muted" className="rounded-2xl p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Hadith</p>
                            <p className="mt-2 font-mono text-3xl text-gold-400">
                                {lockedHadith + currentTokens}/{level.winCondition.requiredHadith}
                            </p>
                            <p className="mt-2 text-sm text-sand-100/75">
                                Carrying {currentTokens} unverified, preserved total {totalVerified}
                            </p>
                        </Card>
                        <Card tone="muted" className="rounded-2xl p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Teachers</p>
                            <p className="mt-2 text-2xl font-semibold text-sand-50">
                                {teacherCount}/{level.winCondition.requiredTeachers.length}
                            </p>
                            <p className="mt-2 text-sm text-sand-100/75">Required scholar encounters completed</p>
                        </Card>
                        <Card tone="muted" className="rounded-2xl p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Controls</p>
                            <p className="mt-2 text-sm text-sand-100/85">Move with `WASD` or arrow keys.</p>
                            <p className="mt-2 text-sm text-sand-100/75">Pause or resume with `Escape`.</p>
                        </Card>
                    </div>
                </DrawerPanel>
            </Drawer>

            <Drawer
                side="right"
                title="Objectives"
                open={missionOpen}
                onToggle={() => setMissionOpen((value) => !value)}
            >
                <ObjectivesDrawerContent level={level} objective={objective} objectives={objectives} />
            </Drawer>

            <DialogueBox />
        </>
    );
};
