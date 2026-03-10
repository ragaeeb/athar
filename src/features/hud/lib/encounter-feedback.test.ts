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
            detail: 'Confiscated 6 carried hadith.',
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
            detail: 'Washed back onto the road 2 carried hadith. Controls are scrambled while the flood pressure lasts.',
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
});
