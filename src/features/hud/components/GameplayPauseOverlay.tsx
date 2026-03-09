import { Link } from 'react-router-dom';

import type { NextObjective } from '@/content/levels/types';
import { getPlayerRuntimeState } from '@/features/gameplay/runtime/player-runtime';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { Button, getButtonClassName } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Overlay } from '@/shared/ui/Overlay';

type GameplayPauseOverlayProps = {
    onRestart: () => void;
    onResume: () => void;
};

const resolveObjectiveLabel = (objective: NextObjective) => {
    if (!objective) {
        return 'Route complete';
    }

    return 'name' in objective ? objective.name : objective.label;
};

const formatCoords = (value: number) => value.toFixed(2);
const formatMeters = (value: number) => Math.round(value).toLocaleString();

export const GameplayPauseOverlay = ({ onRestart, onResume }: GameplayPauseOverlayProps) => {
    const currentTokens = usePlayerStore((state) => state.hadithTokens);
    const levelConfig = useLevelStore((state) => state.config);
    const lockedHadith = useLevelStore((state) => state.lockedHadith);
    const nextObjective = useLevelStore((state) => state.nextObjective);
    const completedTeacherIds = useLevelStore((state) => state.completedTeacherIds);
    const completedMilestoneIds = useLevelStore((state) => state.completedMilestoneIds);
    const playerRuntime = getPlayerRuntimeState();
    const completedTeacherNames =
        levelConfig && completedTeacherIds.length > 0
            ? completedTeacherIds.map(
                  (teacherId) => levelConfig.teachers.find((teacher) => teacher.id === teacherId)?.name ?? teacherId,
              )
            : [];

    return (
        <Overlay>
            <Card tone="reward" className="w-full max-w-4xl rounded-[2rem] p-8">
                <div className="flex flex-col gap-8">
                    <div className="text-center">
                        <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Athar</p>
                        <h2 className="mt-4 font-display text-4xl text-sand-50">Journey Paused</h2>
                        <p className="mt-4 text-sand-100/75">
                            Resume when ready, restart the chapter, or inspect the current route state.
                        </p>
                        <p className="mt-2 font-mono text-xs uppercase tracking-[0.32em] text-sand-100/55">
                            Press Escape to resume
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Card tone="muted" className="rounded-2xl p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Carried</p>
                            <p className="mt-2 font-mono text-3xl text-gold-400">{currentTokens}</p>
                            <p className="mt-2 text-sm text-sand-100/75">Unverified hadith currently on the route.</p>
                        </Card>
                        <Card tone="muted" className="rounded-2xl p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Preserved</p>
                            <p className="mt-2 font-mono text-3xl text-gold-400">{lockedHadith}</p>
                            <p className="mt-2 text-sm text-sand-100/75">
                                Hadith already banked into chapter progress.
                            </p>
                        </Card>
                        <Card tone="muted" className="rounded-2xl p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Objective</p>
                            <p className="mt-2 text-xl font-semibold text-sand-50">
                                {resolveObjectiveLabel(nextObjective)}
                            </p>
                            <p className="mt-2 text-sm text-sand-100/75">Current guidance target.</p>
                        </Card>
                        <Card tone="muted" className="rounded-2xl p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Teachers</p>
                            <p className="mt-2 text-xl font-semibold text-sand-50">
                                {completedTeacherNames.length > 0 ? completedTeacherNames.join(', ') : 'None yet'}
                            </p>
                            <p className="mt-2 text-sm text-sand-100/75">Completed scholar encounters this run.</p>
                        </Card>
                        <Card tone="muted" className="rounded-2xl p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Milestones</p>
                            <p className="mt-2 font-mono text-3xl text-gold-400">{completedMilestoneIds.length}</p>
                            <p className="mt-2 text-sm text-sand-100/75">Reached route anchors so far.</p>
                        </Card>
                        <Card tone="muted" className="rounded-2xl p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Position</p>
                            <p className="mt-2 font-mono text-sm text-sand-50">
                                {formatCoords(playerRuntime.coords.lat)}, {formatCoords(playerRuntime.coords.lng)}
                            </p>
                            <p className="mt-2 font-mono text-xs text-sand-100/60">
                                x={formatMeters(playerRuntime.positionMeters.x)}m z=
                                {formatMeters(playerRuntime.positionMeters.z)}m
                            </p>
                        </Card>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                        <Button onClick={onResume}>Resume Journey</Button>
                        <Button onClick={onRestart} variant="secondary">
                            Restart Chapter
                        </Button>
                        <Link to="/" className={getButtonClassName({ variant: 'ghost' })}>
                            Return Home
                        </Link>
                    </div>
                </div>
            </Card>
        </Overlay>
    );
};
