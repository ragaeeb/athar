import type {
    LevelConfig,
    MilestoneConfig,
    NextObjective,
    TeacherConfig,
    TokenClusterObjective,
    TokenState,
} from '@/content/levels/types';
import {
    MILESTONE_RADIUS_METERS,
    OBSTACLE_TRIGGER_RADIUS_METERS,
    TEACHER_INTERACTION_RADIUS_METERS,
} from '@/shared/constants/gameplay';
import { worldDistanceInMeters } from '@/shared/geo';

export const findCollectableTokens = (
    playerCoords: { lat: number; lng: number },
    tokens: TokenState[],
    radiusMeters: number,
) => tokens.filter((token) => !token.collected && worldDistanceInMeters(token.coords, playerCoords) <= radiusMeters);

export const findTeacherEncounter = (
    playerCoords: { lat: number; lng: number },
    config: LevelConfig,
    completedTeacherIds: string[],
) =>
    config.teachers.find(
        (teacher) =>
            !completedTeacherIds.includes(teacher.id) &&
            worldDistanceInMeters(teacher.coords, playerCoords) <= TEACHER_INTERACTION_RADIUS_METERS,
    ) ?? null;

export const findReachedMilestone = (
    playerCoords: { lat: number; lng: number },
    config: LevelConfig,
    completedMilestoneIds: string[],
) =>
    config.milestones.find(
        (milestone) =>
            !completedMilestoneIds.includes(milestone.id) &&
            worldDistanceInMeters(milestone.coords, playerCoords) <= MILESTONE_RADIUS_METERS,
    ) ?? null;

export const findTriggeredObstacle = (playerCoords: { lat: number; lng: number }, config: LevelConfig) =>
    config.obstacles.find(
        (obstacle) =>
            worldDistanceInMeters(obstacle.coords, playerCoords) <= (obstacle.radius ?? OBSTACLE_TRIGGER_RADIUS_METERS),
    ) ?? null;

export const isWithinCompletedMilestoneSafeZone = (
    playerCoords: { lat: number; lng: number },
    config: LevelConfig,
    completedMilestoneIds: string[],
) =>
    config.milestones.some(
        (milestone) =>
            completedMilestoneIds.includes(milestone.id) &&
            worldDistanceInMeters(milestone.coords, playerCoords) <= MILESTONE_RADIUS_METERS,
    );

const createTokenClusterObjective = (config: LevelConfig, tokens: TokenState[]): TokenClusterObjective | null => {
    const clusterById = new Map(
        config.hadithTokenClusters.map((cluster) => [
            cluster.id,
            {
                cluster,
                remaining: 0,
            },
        ]),
    );

    for (const token of tokens) {
        if (token.collected || token.kind !== 'cluster' || !token.clusterId) {
            continue;
        }

        const existing = clusterById.get(token.clusterId);
        if (existing) {
            existing.remaining += 1;
        }
    }

    const richestCluster = [...clusterById.values()]
        .filter((entry) => entry.remaining > 0)
        .sort((left, right) => right.remaining - left.remaining)[0];

    if (!richestCluster) {
        return null;
    }

    return {
        coords: richestCluster.cluster.center,
        density: richestCluster.remaining,
        hint: `Recover more hadith from ${richestCluster.cluster.label}.`,
        id: `${richestCluster.cluster.id}-objective`,
        kind: 'token-cluster',
        label: richestCluster.cluster.label,
    };
};

export const resolveNextObjective = (
    config: LevelConfig,
    completedTeacherIds: string[],
    completedMilestoneIds: string[],
    tokens: TokenState[],
): NextObjective => {
    const requiredTeacher = config.winCondition.requiredTeachers
        .map((teacherId) => config.teachers.find((teacher) => teacher.id === teacherId))
        .find(
            (teacher): teacher is TeacherConfig => teacher !== undefined && !completedTeacherIds.includes(teacher.id),
        );

    if (requiredTeacher) {
        return requiredTeacher;
    }

    const nextMilestone = config.milestones.find((milestone) => !completedMilestoneIds.includes(milestone.id));

    if (nextMilestone) {
        return nextMilestone;
    }

    return createTokenClusterObjective(config, tokens);
};

export const meetsWinCondition = (
    config: LevelConfig,
    completedTeacherIds: string[],
    completedMilestoneIds: string[],
    lockedHadith: number,
    currentHadith: number,
) =>
    lockedHadith + currentHadith >= config.winCondition.requiredHadith &&
    config.winCondition.requiredTeachers.every((teacherId) => completedTeacherIds.includes(teacherId)) &&
    completedMilestoneIds.includes(config.winCondition.finalMilestone);

export const isTeacherObjective = (objective: NextObjective): objective is TeacherConfig =>
    objective !== null && 'hadith' in objective;

export const isMilestoneObjective = (objective: NextObjective): objective is MilestoneConfig =>
    objective !== null && 'buildingType' in objective;
