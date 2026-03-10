import { describe, expect, it } from 'vitest';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import type { ObstacleConfig } from '@/content/levels/types';
import { resolveObstacleEncounterEffect } from '@/features/gameplay/simulation/systems/obstacle-rules';

const createObstacle = (type: ObstacleConfig['type']): ObstacleConfig => ({
    coords: { lat: 0, lng: 0 },
    id: `${type}-test`,
    label: `${type} test`,
    type,
});

describe('obstacle-rules', () => {
    it('makes rival collectors steal less from Abu Dawud than the balanced baseline', () => {
        const rival = createObstacle('rival');
        const baseline = resolveObstacleEncounterEffect({
            character: {
                guardLossMultiplier: CHARACTER_CONFIGS.bukhari.guardLossMultiplier,
                obstacleDamageMultiplier: CHARACTER_CONFIGS.bukhari.obstacleDamageMultiplier,
                rivalLossMultiplier: CHARACTER_CONFIGS.bukhari.rivalLossMultiplier,
                scrambleDurationMultiplier: CHARACTER_CONFIGS.bukhari.scrambleDurationMultiplier,
                speedMultiplier: CHARACTER_CONFIGS.bukhari.speedMultiplier,
                tokenRadiusMultiplier: CHARACTER_CONFIGS.bukhari.tokenRadiusMultiplier,
            },
            hadithTokens: 12,
            obstacle: rival,
        });
        const reduced = resolveObstacleEncounterEffect({
            character: {
                guardLossMultiplier: CHARACTER_CONFIGS['abu-dawud'].guardLossMultiplier,
                obstacleDamageMultiplier: CHARACTER_CONFIGS['abu-dawud'].obstacleDamageMultiplier,
                rivalLossMultiplier: CHARACTER_CONFIGS['abu-dawud'].rivalLossMultiplier,
                scrambleDurationMultiplier: CHARACTER_CONFIGS['abu-dawud'].scrambleDurationMultiplier,
                speedMultiplier: CHARACTER_CONFIGS['abu-dawud'].speedMultiplier,
                tokenRadiusMultiplier: CHARACTER_CONFIGS['abu-dawud'].tokenRadiusMultiplier,
            },
            hadithTokens: 12,
            obstacle: rival,
        });

        expect(baseline?.effect).toBe('steal');
        expect(reduced?.effect).toBe('steal');
        expect(reduced?.lostCount).toBeLessThan(baseline?.lostCount ?? 0);
    });

    it('shortens flood scramble duration for Muslim', () => {
        const flood = createObstacle('flood');
        const baseline = resolveObstacleEncounterEffect({
            character: {
                guardLossMultiplier: CHARACTER_CONFIGS.bukhari.guardLossMultiplier,
                obstacleDamageMultiplier: CHARACTER_CONFIGS.bukhari.obstacleDamageMultiplier,
                rivalLossMultiplier: CHARACTER_CONFIGS.bukhari.rivalLossMultiplier,
                scrambleDurationMultiplier: CHARACTER_CONFIGS.bukhari.scrambleDurationMultiplier,
                speedMultiplier: CHARACTER_CONFIGS.bukhari.speedMultiplier,
                tokenRadiusMultiplier: CHARACTER_CONFIGS.bukhari.tokenRadiusMultiplier,
            },
            hadithTokens: 10,
            obstacle: flood,
        });
        const shortened = resolveObstacleEncounterEffect({
            character: {
                guardLossMultiplier: CHARACTER_CONFIGS.muslim.guardLossMultiplier,
                obstacleDamageMultiplier: CHARACTER_CONFIGS.muslim.obstacleDamageMultiplier,
                rivalLossMultiplier: CHARACTER_CONFIGS.muslim.rivalLossMultiplier,
                scrambleDurationMultiplier: CHARACTER_CONFIGS.muslim.scrambleDurationMultiplier,
                speedMultiplier: CHARACTER_CONFIGS.muslim.speedMultiplier,
                tokenRadiusMultiplier: CHARACTER_CONFIGS.muslim.tokenRadiusMultiplier,
            },
            hadithTokens: 10,
            obstacle: flood,
        });

        expect(baseline?.effect).toBe('wash');
        expect(shortened?.effect).toBe('wash');
        expect(shortened?.scrambleDurationMs).toBeLessThan(baseline?.scrambleDurationMs ?? 0);
    });

    it('reduces guard confiscation pressure for Tirmidhi', () => {
        const guard = createObstacle('guard');
        const baseline = resolveObstacleEncounterEffect({
            character: {
                guardLossMultiplier: CHARACTER_CONFIGS.bukhari.guardLossMultiplier,
                obstacleDamageMultiplier: CHARACTER_CONFIGS.bukhari.obstacleDamageMultiplier,
                rivalLossMultiplier: CHARACTER_CONFIGS.bukhari.rivalLossMultiplier,
                scrambleDurationMultiplier: CHARACTER_CONFIGS.bukhari.scrambleDurationMultiplier,
                speedMultiplier: CHARACTER_CONFIGS.bukhari.speedMultiplier,
                tokenRadiusMultiplier: CHARACTER_CONFIGS.bukhari.tokenRadiusMultiplier,
            },
            hadithTokens: 12,
            obstacle: guard,
        });
        const reduced = resolveObstacleEncounterEffect({
            character: {
                guardLossMultiplier: CHARACTER_CONFIGS.tirmidhi.guardLossMultiplier,
                obstacleDamageMultiplier: CHARACTER_CONFIGS.tirmidhi.obstacleDamageMultiplier,
                rivalLossMultiplier: CHARACTER_CONFIGS.tirmidhi.rivalLossMultiplier,
                scrambleDurationMultiplier: CHARACTER_CONFIGS.tirmidhi.scrambleDurationMultiplier,
                speedMultiplier: CHARACTER_CONFIGS.tirmidhi.speedMultiplier,
                tokenRadiusMultiplier: CHARACTER_CONFIGS.tirmidhi.tokenRadiusMultiplier,
            },
            hadithTokens: 12,
            obstacle: guard,
        });

        expect(baseline?.effect).toBe('confiscate');
        expect(reduced?.effect).toBe('confiscate');
        expect(reduced?.lostCount).toBeLessThan(baseline?.lostCount ?? 0);
    });

    it('lets sandstorms scramble without requiring carried hadith', () => {
        const effect = resolveObstacleEncounterEffect({
            character: {
                guardLossMultiplier: CHARACTER_CONFIGS.bukhari.guardLossMultiplier,
                obstacleDamageMultiplier: CHARACTER_CONFIGS.bukhari.obstacleDamageMultiplier,
                rivalLossMultiplier: CHARACTER_CONFIGS.bukhari.rivalLossMultiplier,
                scrambleDurationMultiplier: CHARACTER_CONFIGS.bukhari.scrambleDurationMultiplier,
                speedMultiplier: CHARACTER_CONFIGS.bukhari.speedMultiplier,
                tokenRadiusMultiplier: CHARACTER_CONFIGS.bukhari.tokenRadiusMultiplier,
            },
            hadithTokens: 0,
            obstacle: createObstacle('sandstorm'),
        });

        expect(effect).toEqual({
            effect: 'scramble',
            lostCount: 0,
            recoverableCount: 0,
            scrambleDurationMs: effect?.scrambleDurationMs ?? 0,
        });
        expect(effect?.scrambleDurationMs).toBeGreaterThan(0);
    });

    it('makes scorpions immediately lethal on contact', () => {
        const effect = resolveObstacleEncounterEffect({
            character: {
                guardLossMultiplier: CHARACTER_CONFIGS.bukhari.guardLossMultiplier,
                obstacleDamageMultiplier: CHARACTER_CONFIGS.bukhari.obstacleDamageMultiplier,
                rivalLossMultiplier: CHARACTER_CONFIGS.bukhari.rivalLossMultiplier,
                scrambleDurationMultiplier: CHARACTER_CONFIGS.bukhari.scrambleDurationMultiplier,
                speedMultiplier: CHARACTER_CONFIGS.bukhari.speedMultiplier,
                tokenRadiusMultiplier: CHARACTER_CONFIGS.bukhari.tokenRadiusMultiplier,
            },
            hadithTokens: 7,
            obstacle: createObstacle('scorpion'),
        });

        expect(effect).toEqual({
            effect: 'kill',
            lostCount: 7,
            recoverableCount: 0,
            scrambleDurationMs: 0,
        });
    });
});
