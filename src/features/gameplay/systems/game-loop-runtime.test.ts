import { describe, expect, it } from 'vitest';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';

import { getSimulationCharacterModifiers } from './game-loop-runtime';

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
});
