import type { ObstacleConfig } from '@/content/levels/types';
import type { SimulationCharacterModifiers } from '@/features/gameplay/simulation/core/SimulationTypes';
import { OBSTACLE_HIT_COOLDOWN_MS, SCRAMBLE_DURATION_MS } from '@/shared/constants/gameplay';

const GUARD_CONFISCATION_RATIO = 0.55;
const RIVAL_THEFT_RATIO = 0.35;
const VIPER_SCATTER_RATIO = 0.5;
const FLOOD_WASH_RATIO = 0.25;
const GUARD_MINIMUM_LOSS = 2;
const GUARD_SCRAMBLE_DURATION_MS = 2_500;
const FLOOD_SCRAMBLE_DURATION_MS = SCRAMBLE_DURATION_MS + 2_000;

export type ObstacleEncounterEffect = {
    effect: 'confiscate' | 'kill' | 'scatter' | 'scramble' | 'steal' | 'wash';
    lostCount: number;
    recoverableCount: number;
    scrambleDurationMs: number;
};

type ResolveObstacleEffectInput = {
    character: SimulationCharacterModifiers;
    hadithTokens: number;
    obstacle: ObstacleConfig;
};

const clampMinimumLoss = (hadithTokens: number, minimumLoss: number) =>
    Math.min(hadithTokens, hadithTokens > 1 ? minimumLoss : 1);

const resolveScaledLoss = ({
    hadithTokens,
    minimumLoss = 1,
    multiplier,
    ratio,
}: {
    hadithTokens: number;
    minimumLoss?: number;
    multiplier: number;
    ratio: number;
}) => {
    if (hadithTokens <= 0) {
        return 0;
    }

    const scaledLoss = Math.round(hadithTokens * ratio * multiplier);
    return Math.min(hadithTokens, Math.max(clampMinimumLoss(hadithTokens, minimumLoss), scaledLoss));
};

export const isObstacleHitOnCooldown = (lastHitAt: number, nowMs: number) =>
    nowMs - lastHitAt <= OBSTACLE_HIT_COOLDOWN_MS;

export const resolveObstacleEncounterEffect = ({
    character,
    hadithTokens,
    obstacle,
}: ResolveObstacleEffectInput): ObstacleEncounterEffect | null => {
    switch (obstacle.type) {
        case 'guard': {
            if (hadithTokens <= 0) {
                return null;
            }

            return {
                effect: 'confiscate',
                lostCount: resolveScaledLoss({
                    hadithTokens,
                    minimumLoss: GUARD_MINIMUM_LOSS,
                    multiplier: character.obstacleDamageMultiplier * character.guardLossMultiplier,
                    ratio: GUARD_CONFISCATION_RATIO,
                }),
                recoverableCount: 0,
                scrambleDurationMs: Math.round(GUARD_SCRAMBLE_DURATION_MS * character.scrambleDurationMultiplier),
            };
        }
        case 'rival': {
            if (hadithTokens <= 0) {
                return null;
            }

            return {
                effect: 'steal',
                lostCount: resolveScaledLoss({
                    hadithTokens,
                    multiplier: character.obstacleDamageMultiplier * character.rivalLossMultiplier,
                    ratio: RIVAL_THEFT_RATIO,
                }),
                recoverableCount: 0,
                scrambleDurationMs: 0,
            };
        }
        case 'flood': {
            const lostCount =
                hadithTokens > 0
                    ? resolveScaledLoss({
                          hadithTokens,
                          multiplier: character.obstacleDamageMultiplier,
                          ratio: FLOOD_WASH_RATIO,
                      })
                    : 0;

            return {
                effect: 'wash',
                lostCount,
                recoverableCount: lostCount,
                scrambleDurationMs: Math.round(FLOOD_SCRAMBLE_DURATION_MS * character.scrambleDurationMultiplier),
            };
        }
        case 'sandstorm':
            return {
                effect: 'scramble',
                lostCount: 0,
                recoverableCount: 0,
                scrambleDurationMs: Math.round(SCRAMBLE_DURATION_MS * character.scrambleDurationMultiplier),
            };
        case 'scorpion':
            return {
                effect: 'kill',
                lostCount: hadithTokens,
                recoverableCount: 0,
                scrambleDurationMs: 0,
            };
        case 'viper':
            if (hadithTokens <= 0) {
                return null;
            }

            return {
                effect: 'scatter',
                lostCount: resolveScaledLoss({
                    hadithTokens,
                    multiplier: character.obstacleDamageMultiplier,
                    ratio: VIPER_SCATTER_RATIO,
                }),
                recoverableCount: resolveScaledLoss({
                    hadithTokens,
                    multiplier: character.obstacleDamageMultiplier,
                    ratio: VIPER_SCATTER_RATIO,
                }),
                scrambleDurationMs: 0,
            };
    }
};
