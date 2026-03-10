import type { Coords, MeterOffset, ObstacleConfig, ObstacleType } from '@/content/levels/types';
import { offsetCoords } from '@/shared/geo';

const PATROL_ANGULAR_SPEED_RADIANS_PER_SECOND: Record<ObstacleType, number> = {
    flood: 0,
    guard: 0.55,
    rival: 0.9,
    sandstorm: 0,
    scorpion: 0,
    viper: 0.8,
};

const getObstaclePatrolPhaseOffset = (obstacleId: string) =>
    [...obstacleId].reduce((sum, character) => sum + character.charCodeAt(0), 0) * 0.017;

export const resolveObstaclePatrolOffsetMeters = (obstacle: ObstacleConfig, nowMs: number): MeterOffset => {
    if (!obstacle.patrolRadius) {
        return { x: 0, z: 0 };
    }

    const angularSpeed = PATROL_ANGULAR_SPEED_RADIANS_PER_SECOND[obstacle.type];
    const angle = (nowMs / 1_000) * angularSpeed + getObstaclePatrolPhaseOffset(obstacle.id);

    return {
        x: Math.cos(angle) * obstacle.patrolRadius,
        z: Math.sin(angle) * obstacle.patrolRadius,
    };
};

export const resolveObstaclePatrolCoords = (obstacle: ObstacleConfig, nowMs: number): Coords =>
    offsetCoords(obstacle.coords, resolveObstaclePatrolOffsetMeters(obstacle, nowMs));
