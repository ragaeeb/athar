import SunCalc from 'suncalc';

import type { Coords, HadithTokenCluster, LightingConfig, MeterOffset, TokenState } from '@/content/levels/types';

const METERS_PER_DEGREE_LAT = 111_320;

const randomId = () => globalThis.crypto.randomUUID();

export const metersOffsetFromCoords = (point: Coords, origin: Coords): MeterOffset => {
    const latDiff = (point.lat - origin.lat) * METERS_PER_DEGREE_LAT;
    const avgLat = ((point.lat + origin.lat) / 2) * (Math.PI / 180);
    const lngDiff = (point.lng - origin.lng) * METERS_PER_DEGREE_LAT * Math.cos(avgLat);
    return {
        x: lngDiff,
        z: latDiff,
    };
};

/**
 * Fast flat-earth distance approximation. O(1) per call — suitable for
 * per-frame collision checks where Mercator-precise accuracy is unnecessary.
 */
export const worldDistanceInMeters = (point: Coords, origin: Coords) => {
    const latDiff = (point.lat - origin.lat) * METERS_PER_DEGREE_LAT;
    const avgLat = ((point.lat + origin.lat) / 2) * (Math.PI / 180);
    const lngDiff = (point.lng - origin.lng) * METERS_PER_DEGREE_LAT * Math.cos(avgLat);
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
};

export const preciseDistanceInMeters = (point: Coords, origin: Coords) => worldDistanceInMeters(point, origin);

export const metersPerDegreeLongitude = (latitude: number) =>
    METERS_PER_DEGREE_LAT * Math.cos((latitude * Math.PI) / 180);

export const offsetCoords = (origin: Coords, offsetMeters: MeterOffset): Coords => {
    const lngScale = Math.max(metersPerDegreeLongitude(origin.lat), 1);
    return {
        lat: origin.lat + offsetMeters.z / METERS_PER_DEGREE_LAT,
        lng: origin.lng + offsetMeters.x / lngScale,
    };
};

export const moveCoordsByBearing = (origin: Coords, bearingRadians: number, distanceMeters: number): Coords =>
    offsetCoords(origin, {
        x: Math.sin(bearingRadians) * distanceMeters,
        z: Math.cos(bearingRadians) * distanceMeters,
    });

export const headingBetweenCoords = (from: Coords, to: Coords) => {
    const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;
    const fromLat = (from.lat * Math.PI) / 180;
    const toLat = (to.lat * Math.PI) / 180;

    const y = Math.sin(deltaLng) * Math.cos(toLat);
    const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);

    return Math.atan2(y, x);
};

export const directionLabelFromBearing = (bearingRadians: number) => {
    const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'] as const;
    const normalized = (bearingRadians + Math.PI * 2) % (Math.PI * 2);
    const index = Math.round(normalized / (Math.PI / 4)) % directions.length;
    return directions[index] ?? 'north';
};

export const formatDistance = (distanceMeters: number) => {
    if (distanceMeters >= 1_000_000) {
        return `${(distanceMeters / 1_000_000).toFixed(1)}k km`;
    }

    if (distanceMeters >= 1_000) {
        return `${Math.round(distanceMeters / 100) / 10} km`;
    }

    return `${Math.round(distanceMeters)} m`;
};

export const generateClusterTokens = (clusters: HadithTokenCluster[]): TokenState[] =>
    clusters.flatMap((cluster) =>
        Array.from({ length: cluster.count }, (_, index) => {
            const angle = (Math.PI * 2 * index) / Math.max(cluster.count, 1);
            const distance = cluster.radius * (0.45 + (index % 3) * 0.2);
            const localOffsetMeters = {
                x: Math.cos(angle) * distance,
                z: Math.sin(angle) * distance,
            };

            return {
                anchor: cluster.center,
                bounceSeed: index * 1.3,
                clusterId: cluster.id,
                collected: false,
                coords: offsetCoords(cluster.center, localOffsetMeters),
                expiresAt: null,
                id: randomId(),
                kind: 'cluster' as const,
                localOffsetMeters,
                value: 1,
            };
        }),
    );

export const generateScatterTokens = (center: Coords, count: number, expiresAt: number): TokenState[] =>
    Array.from({ length: count }, (_, index) => {
        const angle = ((index + 1) * Math.PI * 0.7) % (Math.PI * 2);
        const distance = 18_000 + index * 2_500;
        const localOffsetMeters = {
            x: Math.cos(angle) * distance,
            z: Math.sin(angle) * distance,
        };

        return {
            anchor: center,
            bounceSeed: index * 0.8,
            clusterId: null,
            collected: false,
            coords: offsetCoords(center, localOffsetMeters),
            expiresAt,
            id: randomId(),
            kind: 'scattered' as const,
            localOffsetMeters,
            value: 1,
        };
    });

export const getSunLightPosition = (coords: Coords, lighting: LightingConfig) => {
    const sampleDate = new Date(Date.UTC(860, 5, 1, lighting.hour, lighting.minute, 0));
    const sun = SunCalc.getPosition(sampleDate, coords.lat, coords.lng);
    const azimuthFromNorth = sun.azimuth + Math.PI;
    const distance = 180;
    const altitude = Math.max(Math.sin(sun.altitude), 0.2) * 120;

    return [Math.sin(azimuthFromNorth) * distance, altitude, Math.cos(azimuthFromNorth) * distance] as const;
};
