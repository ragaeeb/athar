import type { LevelConfig, LightingConfig } from '@/content/levels/types';
import { getSunLightPosition } from '@/features/map/lib/geo';

type EnvironmentPreset = 'city' | 'dawn' | 'night' | 'park' | 'sunset';

export type LevelLightingRig = {
    ambientIntensity: number;
    directionalColor: string;
    directionalIntensity: number;
    environmentPreset: EnvironmentPreset;
    sunPosition: readonly [number, number, number];
};

const resolveLightingBand = (lighting: LightingConfig) => {
    if (lighting.hour < 6) {
        return 'night';
    }
    if (lighting.hour < 9) {
        return 'dawn';
    }
    if (lighting.hour < 16) {
        return 'day';
    }
    if (lighting.hour < 18) {
        return 'afternoon';
    }
    return 'dusk';
};

export const resolveLevelLightingRig = (
    level: Pick<LevelConfig, 'ambientCue' | 'lighting' | 'origin'>,
): LevelLightingRig => {
    const band = resolveLightingBand(level.lighting);

    switch (band) {
        case 'night':
            return {
                ambientIntensity: 0.34 * Math.PI,
                directionalColor: '#9fb9ff',
                directionalIntensity: 0.58 * Math.PI,
                environmentPreset: 'night',
                sunPosition: getSunLightPosition(level.origin, level.lighting),
            };
        case 'dawn':
            return {
                ambientIntensity: 0.5 * Math.PI,
                directionalColor: '#ffd4a8',
                directionalIntensity: 0.9 * Math.PI,
                environmentPreset: 'dawn',
                sunPosition: getSunLightPosition(level.origin, level.lighting),
            };
        case 'day':
            return {
                ambientIntensity: 0.78 * Math.PI,
                directionalColor: '#fff2d2',
                directionalIntensity: 1.26 * Math.PI,
                environmentPreset: level.ambientCue === 'ambient-city' ? 'city' : 'park',
                sunPosition: getSunLightPosition(level.origin, level.lighting),
            };
        case 'afternoon':
            return {
                ambientIntensity: 0.7 * Math.PI,
                directionalColor: '#ffe0bd',
                directionalIntensity: 1.18 * Math.PI,
                environmentPreset: level.ambientCue === 'ambient-city' ? 'city' : 'park',
                sunPosition: getSunLightPosition(level.origin, level.lighting),
            };
        case 'dusk':
            return {
                ambientIntensity: 0.56 * Math.PI,
                directionalColor: '#ffbf87',
                directionalIntensity: 0.96 * Math.PI,
                environmentPreset: 'sunset',
                sunPosition: getSunLightPosition(level.origin, level.lighting),
            };
    }
};
