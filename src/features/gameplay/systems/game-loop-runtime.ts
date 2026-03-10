import type { CharacterConfig } from '@/content/characters/characters';
import type { SimulationCharacterModifiers } from '@/features/gameplay/simulation/core/SimulationTypes';

export const getSimulationCharacterModifiers = (
    characterConfig: CharacterConfig,
    movementSpeedMultiplier: number,
): SimulationCharacterModifiers => ({
    guardLossMultiplier: characterConfig.guardLossMultiplier,
    obstacleDamageMultiplier: characterConfig.obstacleDamageMultiplier,
    rivalLossMultiplier: characterConfig.rivalLossMultiplier,
    scrambleDurationMultiplier: characterConfig.scrambleDurationMultiplier,
    speedMultiplier: characterConfig.speedMultiplier * movementSpeedMultiplier,
    tokenRadiusMultiplier: characterConfig.tokenRadiusMultiplier,
});

export const advanceSimulationNowMs = (currentNowMs: number, frameDeltaMs: number) => currentNowMs + frameDeltaMs;
