import type { NextObjective } from '@/content/levels/types';

type NavigationLegendProps = {
    objective: NextObjective;
    distance: string;
    directionLabel: string;
};

export const NavigationLegend = ({ objective, distance, directionLabel }: NavigationLegendProps) => {
    if (!objective) {
        return (
            <div className="rounded-2xl border border-white/10 bg-ink-950/60 px-4 py-3 backdrop-blur">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Navigation</p>
                <p className="mt-2 text-sm text-sand-100/75">All visible objectives are complete.</p>
            </div>
        );
    }

    const objectiveLabel = 'name' in objective ? objective.name : objective.label;

    return (
        <div className="rounded-2xl border border-white/10 bg-ink-950/60 px-4 py-3 backdrop-blur">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Next Objective</p>
            <p className="mt-2 font-semibold text-sand-50">{objectiveLabel}</p>
            <p className="mt-1 text-sm text-sand-100/75">
                Head {directionLabel} toward {objectiveLabel}
            </p>
            <p className="mt-1 font-mono text-sm text-gold-400">{distance}</p>
        </div>
    );
};
