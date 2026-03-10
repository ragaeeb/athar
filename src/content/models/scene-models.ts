import type { MilestoneBuildingType, ObstacleType } from '@/content/levels/types';

export const TRAVELING_SCHOLAR_MODEL_PATH = '/models/scholars/traveling-scholar.glb';
export const THATCHED_HUT_MODEL_PATH = '/models/buildings/thatched-hut.glb';
export const MEDIEVAL_HOUSE_MODEL_PATH = '/models/buildings/medieval-house.glb';
export const SCORPION_MODEL_PATH = '/models/obstacles/scorpion.glb';
export const VIPER_MODEL_PATH = '/models/obstacles/viper.glb';
export const GUARD_MODEL_PATH = '/models/obstacles/guard.glb';
export const RIVAL_MODEL_PATH = '/models/obstacles/rival.glb';

export const MILESTONE_STRUCTURE_MODELS: Record<
    MilestoneBuildingType,
    {
        modelPath: string;
        rotationY: number;
        targetHeight: number;
    }
> = {
    caravanserai: {
        modelPath: THATCHED_HUT_MODEL_PATH,
        rotationY: Math.PI / 2,
        targetHeight: 3.1,
    },
    madrasa: {
        modelPath: MEDIEVAL_HOUSE_MODEL_PATH,
        rotationY: Math.PI / 2,
        targetHeight: 3.4,
    },
    market: {
        modelPath: THATCHED_HUT_MODEL_PATH,
        rotationY: Math.PI / 4,
        targetHeight: 2.8,
    },
    minaret: {
        modelPath: MEDIEVAL_HOUSE_MODEL_PATH,
        rotationY: Math.PI / 2,
        targetHeight: 3.6,
    },
    mosque: {
        modelPath: MEDIEVAL_HOUSE_MODEL_PATH,
        rotationY: Math.PI / 3,
        targetHeight: 3.8,
    },
};

export const OBSTACLE_MODELS: Partial<
    Record<
        ObstacleType,
        {
            fitMode?: 'footprint' | 'height';
            modelPath: string;
            rotationY: number;
            targetFootprint?: number;
            targetHeight: number;
        }
    >
> = {
    guard: {
        fitMode: 'height',
        modelPath: GUARD_MODEL_PATH,
        rotationY: Math.PI,
        targetHeight: 2.4,
    },
    rival: {
        fitMode: 'height',
        modelPath: RIVAL_MODEL_PATH,
        rotationY: Math.PI,
        targetHeight: 2.1,
    },
    scorpion: {
        fitMode: 'footprint',
        modelPath: SCORPION_MODEL_PATH,
        rotationY: Math.PI / 2,
        targetFootprint: 1.45,
        targetHeight: 1.6,
    },
    viper: {
        fitMode: 'footprint',
        modelPath: VIPER_MODEL_PATH,
        rotationY: Math.PI / 2,
        targetFootprint: 1.9,
        targetHeight: 1.2,
    },
};
