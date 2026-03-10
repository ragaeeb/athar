import { describe, expect, it } from 'vitest';

import { resolveEncounterFeedback } from '@/features/hud/lib/encounter-feedback';

describe('encounter-feedback', () => {
    it('describes confiscation hazards as danger feedback', () => {
        expect(
            resolveEncounterFeedback({
                effect: 'confiscate',
                lostCount: 6,
                obstacleId: 'guard',
                obstacleLabel: 'Corrupt Guard',
                obstacleType: 'guard',
                recoverableCount: 0,
                scrambleDurationMs: 2_500,
                type: 'hazard-triggered',
            }),
        ).toEqual({
            detail: 'Confiscated 6 carried hadith. Your controls are briefly scrambled.',
            durationMs: 3_400,
            title: 'Corrupt Guard',
            tone: 'danger',
        });
    });

    it('describes flood wash hazards as recoverable route pressure', () => {
        expect(
            resolveEncounterFeedback({
                effect: 'wash',
                lostCount: 2,
                obstacleId: 'flood',
                obstacleLabel: 'Wadi Flood',
                obstacleType: 'flood',
                recoverableCount: 2,
                scrambleDurationMs: 7_000,
                type: 'hazard-triggered',
            }),
        ).toEqual({
            detail: '2 carried hadith were washed back onto the road. Controls are scrambled while the flood pressure lasts.',
            durationMs: 3_000,
            title: 'Wadi Flood',
            tone: 'accent',
        });
    });

    it('describes lethal scorpion ambushes as run-ending danger feedback', () => {
        expect(
            resolveEncounterFeedback({
                effect: 'kill',
                lostCount: 0,
                obstacleId: 'scorpion',
                obstacleLabel: 'Scorpion Ambush',
                obstacleType: 'scorpion',
                recoverableCount: 0,
                scrambleDurationMs: 0,
                type: 'hazard-triggered',
            }),
        ).toEqual({
            detail: 'The ambush closed immediately. This chapter run has ended.',
            durationMs: 3_600,
            title: 'Scorpion Ambush',
            tone: 'danger',
        });
    });

    it('describes rival theft hazards as warning feedback', () => {
        expect(
            resolveEncounterFeedback({
                effect: 'steal',
                lostCount: 3,
                obstacleId: 'rival',
                obstacleLabel: 'Rival Collector',
                obstacleType: 'rival',
                recoverableCount: 0,
                scrambleDurationMs: 0,
                type: 'hazard-triggered',
            }),
        ).toEqual({
            detail: 'A rival stole 3 carried hadith.',
            durationMs: 3_000,
            title: 'Rival Collector',
            tone: 'warning',
        });
    });

    it('describes scatter hazards as danger feedback', () => {
        expect(
            resolveEncounterFeedback({
                effect: 'scatter',
                lostCount: 4,
                obstacleId: 'viper',
                obstacleLabel: 'Desert Viper',
                obstacleType: 'viper',
                recoverableCount: 4,
                scrambleDurationMs: 0,
                type: 'hazard-triggered',
            }),
        ).toEqual({
            detail: 'Scattered 4 carried hadith.',
            durationMs: 3_200,
            title: 'Desert Viper',
            tone: 'danger',
        });
    });

    it('describes scramble-only hazards as warning feedback', () => {
        expect(
            resolveEncounterFeedback({
                effect: 'scramble',
                lostCount: 0,
                obstacleId: 'sandstorm',
                obstacleLabel: 'Dust Wall',
                obstacleType: 'sandstorm',
                recoverableCount: 0,
                scrambleDurationMs: 4_500,
                type: 'hazard-triggered',
            }),
        ).toEqual({
            detail: 'Controls are scrambled while you remain inside the hazard corridor.',
            durationMs: 2_800,
            title: 'Dust Wall',
            tone: 'warning',
        });
    });

    it('uses non-loss flood copy when no hadith were carried', () => {
        expect(
            resolveEncounterFeedback({
                effect: 'wash',
                lostCount: 0,
                obstacleId: 'flood',
                obstacleLabel: 'Wadi Flood',
                obstacleType: 'flood',
                recoverableCount: 0,
                scrambleDurationMs: 7_000,
                type: 'hazard-triggered',
            }),
        ).toEqual({
            detail: 'The flood distorts the route and throws off your movement.',
            durationMs: 3_000,
            title: 'Wadi Flood',
            tone: 'accent',
        });
    });
});
