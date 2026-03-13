import type { Coords, HadithTokenCluster, LevelConfig, MeterOffset } from '@/content/levels/types';
import { metersOffsetFromCoords, offsetCoords } from '@/shared/geo';

export const COMPACT_ROUTE_QUERY_PARAM = 'atharCompactRoute';

const COMPACT_ROUTE_SCALE = 0.05;
const COMPACT_ROUTE_ZOOM_DELTA = 2;
const MIN_CLUSTER_RADIUS_METERS = 4_000;
const MIN_OBSTACLE_RADIUS_METERS = 6_000;

const scaleOffset = (offset: MeterOffset, scale: number): MeterOffset => ({
    x: offset.x * scale,
    z: offset.z * scale,
});

const scaleCoordsFromOrigin = (coords: Coords, origin: Coords, scale: number) =>
    offsetCoords(origin, scaleOffset(metersOffsetFromCoords(coords, origin), scale));

const scaleCluster = (cluster: HadithTokenCluster, origin: Coords, scale: number): HadithTokenCluster => ({
    ...cluster,
    center: scaleCoordsFromOrigin(cluster.center, origin, scale),
    radius: Math.max(Math.round(cluster.radius * scale), MIN_CLUSTER_RADIUS_METERS),
});

const scaleOptionalRadius = (radius: number | undefined) =>
    radius === undefined ? undefined : Math.max(Math.round(radius * COMPACT_ROUTE_SCALE), MIN_OBSTACLE_RADIUS_METERS);

export const applyCompactRouteVariant = (level: LevelConfig): LevelConfig => {
    const scaledInitialViewCenter = scaleCoordsFromOrigin(
        {
            lat: level.initialView.latitude,
            lng: level.initialView.longitude,
        },
        level.origin,
        COMPACT_ROUTE_SCALE,
    );

    return {
        ...level,
        hadithTokenClusters: level.hadithTokenClusters.map((cluster) =>
            scaleCluster(cluster, level.origin, COMPACT_ROUTE_SCALE),
        ),
        initialView: {
            ...level.initialView,
            latitude: scaledInitialViewCenter.lat,
            longitude: scaledInitialViewCenter.lng,
            zoom: level.initialView.zoom + COMPACT_ROUTE_ZOOM_DELTA,
        },
        milestones: level.milestones.map((milestone) => ({
            ...milestone,
            coords: scaleCoordsFromOrigin(milestone.coords, level.origin, COMPACT_ROUTE_SCALE),
        })),
        namedAreas: level.namedAreas.map((area) => ({
            ...area,
            coords: scaleCoordsFromOrigin(area.coords, level.origin, COMPACT_ROUTE_SCALE),
        })),
        obstacles: level.obstacles.map((obstacle) => {
            const patrolRadius = scaleOptionalRadius(obstacle.patrolRadius);
            const radius = scaleOptionalRadius(obstacle.radius);

            return {
                ...obstacle,
                coords: scaleCoordsFromOrigin(obstacle.coords, level.origin, COMPACT_ROUTE_SCALE),
                ...(patrolRadius === undefined ? {} : { patrolRadius }),
                ...(radius === undefined ? {} : { radius }),
            };
        }),
        teachers: level.teachers.map((teacher) => ({
            ...teacher,
            coords: scaleCoordsFromOrigin(teacher.coords, level.origin, COMPACT_ROUTE_SCALE),
        })),
    };
};

export const applyLevelRouteVariants = (level: LevelConfig, requestUrl: string): LevelConfig => {
    const url = new URL(requestUrl);
    if (url.searchParams.get(COMPACT_ROUTE_QUERY_PARAM) !== '1') {
        return level;
    }

    return applyCompactRouteVariant(level);
};
