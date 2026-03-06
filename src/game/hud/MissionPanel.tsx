import { motion } from 'framer-motion';

import type { LevelConfig, ObjectiveStatus } from '@/game/levels/level.types';

type MissionPanelProps = {
    level: LevelConfig;
    objectives: ObjectiveStatus[];
};

export const MissionPanel = ({ level, objectives }: MissionPanelProps) => (
    <motion.aside
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-ink-950/70 p-5 shadow-2xl backdrop-blur"
    >
        <p className="font-display text-xs uppercase tracking-[0.4em] text-gold-400">{level.name}</p>
        <h2 className="mt-3 font-display text-2xl text-sand-50">{level.subtitle}</h2>
        <p className="mt-3 text-sm leading-6 text-sand-100/80">{level.narrative}</p>
        <div className="mt-5 space-y-3">
            {objectives.map((objective, index) => (
                <motion.div
                    key={objective.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + index * 0.07 }}
                    className={`rounded-2xl border px-4 py-3 ${
                        objective.completed ? 'border-teal-500/40 bg-teal-500/10' : 'border-white/8 bg-white/3'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <span
                            className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                objective.completed ? 'bg-teal-500 text-ink-950' : 'border border-white/15 text-sand-50'
                            }`}
                        >
                            {objective.completed ? '✓' : index + 1}
                        </span>
                        <div>
                            <p className="font-semibold text-sand-50">{objective.label}</p>
                            <p className="text-sm text-sand-100/70">{objective.detail}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    </motion.aside>
);
