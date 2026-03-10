import SunCalc from 'suncalc';
import type { Coords, LightingConfig } from '@/content/levels/types';

export {
    directionLabelFromBearing,
    formatDistance,
    generateClusterTokens,
    generateScatterTokens,
    getOriginRebaseDelta,
    getRouteEndpointDistance,
    headingBetweenCoords,
    metersOffsetFromCoords,
    moveCoordsByBearing,
    offsetCoords,
    worldDistanceInMeters,
} from '@/shared/geo';

export const getSunLightPosition = (coords: Coords, lighting: LightingConfig) => {
    const sampleDate = new Date(Date.UTC(860, 5, 1, lighting.hour, lighting.minute, 0));
    const sun = SunCalc.getPosition(sampleDate, coords.lat, coords.lng);
    const azimuthFromNorth = sun.azimuth + Math.PI;
    const distance = 180;
    const altitude = Math.max(Math.sin(sun.altitude), 0.2) * 120;

    return [Math.sin(azimuthFromNorth) * distance, altitude, Math.cos(azimuthFromNorth) * distance] as const;
};
