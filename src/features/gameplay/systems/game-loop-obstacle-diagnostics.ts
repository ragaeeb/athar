import type { Coords, ObstacleConfig } from '@/content/levels/types';
import type { SimulationState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { isWithinCompletedMilestoneSafeZone } from '@/features/gameplay/simulation/systems/CollisionSystem';
import { resolveObstaclePatrolCoords } from '@/features/gameplay/simulation/systems/obstacle-patrol';
import {
    isObstacleHitOnCooldown,
    type ObstacleEncounterEffect,
    resolveObstacleEncounterEffect,
} from '@/features/gameplay/simulation/systems/obstacle-rules';
import { OBSTACLE_TRIGGER_RADIUS_METERS } from '@/shared/constants/gameplay';
import { worldDistanceInMeters } from '@/shared/geo';

export const OBSTACLE_DIAGNOSTIC_MARGIN_METERS = 20_000;

export type ObstacleDiagnosticEventName =
    | 'OBSTACLE_NEARBY'
    | 'OBSTACLE_SUPPRESSED_COOLDOWN'
    | 'OBSTACLE_SUPPRESSED_EMPTY_CARRY'
    | 'OBSTACLE_SUPPRESSED_NO_EFFECT'
    | 'OBSTACLE_SUPPRESSED_SAFE_ZONE'
    | 'OBSTACLE_WILL_TRIGGER';

export type ObstacleDiagnosticSuppressionReason =
    | 'cooldown'
    | 'empty-carry'
    | 'no-effect'
    | 'outside-trigger-radius'
    | 'safe-zone'
    | 'will-trigger';

export type ObstacleDiagnostic = {
    distanceFromTriggerMeters: number;
    distanceMeters: number;
    effect: ObstacleEncounterEffect['effect'] | null;
    eventName: ObstacleDiagnosticEventName;
    hadithTokens: number;
    obstacleBaseCoords: Coords;
    obstacleCoords: Coords;
    obstacleId: string;
    obstacleLabel: string;
    obstacleType: ObstacleConfig['type'];
    onCooldown: boolean;
    playerCoords: Coords;
    safeZoneSuppressed: boolean;
    signature: string;
    suppressionReason: ObstacleDiagnosticSuppressionReason;
    triggerRadiusMeters: number;
    withinTriggerRadius: boolean;
};

const resolveNearestObstacle = (state: SimulationState) =>
    state.level.obstacles
        .map((obstacle) => {
            const obstacleCoords = resolveObstaclePatrolCoords(obstacle, state.nowMs);
            const triggerRadius = obstacle.radius ?? OBSTACLE_TRIGGER_RADIUS_METERS;
            const distanceMeters = worldDistanceInMeters(obstacleCoords, state.player.coords);
            const distanceFromTriggerMeters = distanceMeters - triggerRadius;

            return {
                distanceFromTriggerMeters,
                distanceMeters,
                distanceToTriggerEdgeMeters: Math.max(distanceFromTriggerMeters, 0),
                obstacle,
                obstacleCoords,
                triggerRadius,
            };
        })
        .sort((left, right) => left.distanceToTriggerEdgeMeters - right.distanceToTriggerEdgeMeters)[0];

const resolveSuppressionReason = ({
    effect,
    hadithTokens,
    onCooldown,
    safeZoneSuppressed,
    withinTriggerRadius,
}: {
    effect: ObstacleEncounterEffect | null;
    hadithTokens: number;
    onCooldown: boolean;
    safeZoneSuppressed: boolean;
    withinTriggerRadius: boolean;
}): ObstacleDiagnosticSuppressionReason => {
    if (!withinTriggerRadius) {
        return 'outside-trigger-radius';
    }

    if (safeZoneSuppressed) {
        return 'safe-zone';
    }

    if (effect === null) {
        return hadithTokens <= 0 ? 'empty-carry' : 'no-effect';
    }

    if (onCooldown) {
        return 'cooldown';
    }

    return 'will-trigger';
};

const resolveDiagnosticEventName = (
    suppressionReason: ObstacleDiagnosticSuppressionReason,
): ObstacleDiagnosticEventName => {
    switch (suppressionReason) {
        case 'outside-trigger-radius':
            return 'OBSTACLE_NEARBY';
        case 'safe-zone':
            return 'OBSTACLE_SUPPRESSED_SAFE_ZONE';
        case 'empty-carry':
            return 'OBSTACLE_SUPPRESSED_EMPTY_CARRY';
        case 'no-effect':
            return 'OBSTACLE_SUPPRESSED_NO_EFFECT';
        case 'cooldown':
            return 'OBSTACLE_SUPPRESSED_COOLDOWN';
        case 'will-trigger':
            return 'OBSTACLE_WILL_TRIGGER';
    }
};

export const resolveObstacleDiagnostic = (state: SimulationState): ObstacleDiagnostic | null => {
    const nearestObstacle = resolveNearestObstacle(state);

    if (!nearestObstacle) {
        return null;
    }

    const withinDiagnosticRange = nearestObstacle.distanceToTriggerEdgeMeters <= OBSTACLE_DIAGNOSTIC_MARGIN_METERS;

    if (!withinDiagnosticRange) {
        return null;
    }

    const safeZoneSuppressed = isWithinCompletedMilestoneSafeZone(
        state.player.coords,
        state.level,
        state.levelState.completedMilestoneIds,
    );
    const effect = safeZoneSuppressed
        ? null
        : resolveObstacleEncounterEffect({
              character: state.character,
              hadithTokens: state.player.hadithTokens,
              obstacle: nearestObstacle.obstacle,
          });
    const onCooldown = isObstacleHitOnCooldown(state.player.lastHitAt, state.nowMs);
    const withinTriggerRadius = nearestObstacle.distanceFromTriggerMeters <= 0;
    const suppressionReason = resolveSuppressionReason({
        effect,
        hadithTokens: state.player.hadithTokens,
        onCooldown,
        safeZoneSuppressed,
        withinTriggerRadius,
    });
    const eventName = resolveDiagnosticEventName(suppressionReason);

    return {
        distanceFromTriggerMeters: nearestObstacle.distanceFromTriggerMeters,
        distanceMeters: nearestObstacle.distanceMeters,
        effect: effect?.effect ?? null,
        eventName,
        hadithTokens: state.player.hadithTokens,
        obstacleBaseCoords: nearestObstacle.obstacle.coords,
        obstacleCoords: nearestObstacle.obstacleCoords,
        obstacleId: nearestObstacle.obstacle.id,
        obstacleLabel: nearestObstacle.obstacle.label,
        obstacleType: nearestObstacle.obstacle.type,
        onCooldown,
        playerCoords: state.player.coords,
        safeZoneSuppressed,
        signature: [
            nearestObstacle.obstacle.id,
            eventName,
            Math.round(nearestObstacle.distanceMeters / 5_000),
            state.player.hadithTokens,
        ].join(':'),
        suppressionReason,
        triggerRadiusMeters: nearestObstacle.triggerRadius,
        withinTriggerRadius,
    };
};
