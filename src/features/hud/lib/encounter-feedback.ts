import type { SimulationEvent } from '@/features/gameplay/simulation/core/SimulationTypes';

export type EncounterFeedback = {
    detail: string;
    durationMs: number;
    title: string;
    tone: 'accent' | 'danger' | 'warning';
};

type HazardTriggeredEvent = Extract<SimulationEvent, { type: 'hazard-triggered' }>;

const formatLostHadithDetail = (lostCount: number, action: string) =>
    lostCount === 1 ? `${action} 1 carried hadith.` : `${action} ${lostCount} carried hadith.`;

export const resolveEncounterFeedback = (event: HazardTriggeredEvent): EncounterFeedback => {
    switch (event.effect) {
        case 'confiscate':
            return {
                detail: formatLostHadithDetail(event.lostCount, 'Confiscated'),
                durationMs: 3_400,
                title: event.obstacleLabel,
                tone: 'danger',
            };
        case 'kill':
            return {
                detail: 'The ambush closed immediately. This chapter run has ended.',
                durationMs: 3_600,
                title: event.obstacleLabel,
                tone: 'danger',
            };
        case 'scatter':
            return {
                detail: formatLostHadithDetail(event.lostCount, 'Scattered'),
                durationMs: 3_200,
                title: event.obstacleLabel,
                tone: 'danger',
            };
        case 'scramble':
            return {
                detail: 'Controls are scrambled while you remain inside the hazard corridor.',
                durationMs: 2_800,
                title: event.obstacleLabel,
                tone: 'warning',
            };
        case 'steal':
            return {
                detail: formatLostHadithDetail(event.lostCount, 'A rival stole'),
                durationMs: 3_000,
                title: event.obstacleLabel,
                tone: 'warning',
            };
        case 'wash':
            return {
                detail:
                    event.lostCount > 0
                        ? `${formatLostHadithDetail(event.lostCount, 'Washed back onto the road')} Controls are scrambled while the flood pressure lasts.`
                        : 'The flood distorts the route and throws off your movement.',
                durationMs: 3_000,
                title: event.obstacleLabel,
                tone: 'accent',
            };
    }
};
