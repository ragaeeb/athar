import { describe, expect, it } from 'vitest';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';

import { advanceSimulationNowMs, getSimulationCharacterModifiers } from './game-loop-runtime';

describe('getSimulationCharacterModifiers', () => {
    it('applies the runtime walk-speed multiplier on top of the selected character speed multiplier', () => {
        expect(getSimulationCharacterModifiers(CHARACTER_CONFIGS.muslim, 3)).toEqual({
            obstacleDamageMultiplier: CHARACTER_CONFIGS.muslim.obstacleDamageMultiplier,
            speedMultiplier: CHARACTER_CONFIGS.muslim.speedMultiplier * 3,
            tokenRadiusMultiplier: CHARACTER_CONFIGS.muslim.tokenRadiusMultiplier,
        });
    });

    it('leaves non-speed modifiers unchanged', () => {
        expect(getSimulationCharacterModifiers(CHARACTER_CONFIGS['abu-dawud'], 0.5)).toEqual({
            obstacleDamageMultiplier: CHARACTER_CONFIGS['abu-dawud'].obstacleDamageMultiplier,
            speedMultiplier: CHARACTER_CONFIGS['abu-dawud'].speedMultiplier * 0.5,
            tokenRadiusMultiplier: CHARACTER_CONFIGS['abu-dawud'].tokenRadiusMultiplier,
        });
    });

    it('handles multiplier of 1 (identity)', () => {
        const result = getSimulationCharacterModifiers(CHARACTER_CONFIGS.muslim, 1);
        expect(result.speedMultiplier).toBe(CHARACTER_CONFIGS.muslim.speedMultiplier);
    });

    it('handles multiplier of 0', () => {
        const result = getSimulationCharacterModifiers(CHARACTER_CONFIGS.muslim, 0);
        expect(result.speedMultiplier).toBe(0);
    });
});

describe('advanceSimulationNowMs', () => {
    it('advances the authoritative simulation clock from frame delta instead of wall-clock reads', () => {
        expect(advanceSimulationNowMs(1_000, 16.67)).toBeCloseTo(1_016.67, 5);
        expect(advanceSimulationNowMs(1_016.67, 0)).toBeCloseTo(1_016.67, 5);
    });
});
