import type { CharacterConfig } from '@/content/characters/characters';
import type { SimulationCharacterModifiers } from '@/features/gameplay/simulation/core/SimulationTypes';

export const getSimulationCharacterModifiers = (
    characterConfig: CharacterConfig,
    movementSpeedMultiplier: number,
): SimulationCharacterModifiers => ({
    obstacleDamageMultiplier: characterConfig.obstacleDamageMultiplier,
    speedMultiplier: characterConfig.speedMultiplier * movementSpeedMultiplier,
    tokenRadiusMultiplier: characterConfig.tokenRadiusMultiplier,
});
