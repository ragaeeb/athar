import type { MilestoneBuildingType } from '@/content/levels/types';

export const TRAVELING_SCHOLAR_MODEL_PATH = '/models/scholars/traveling-scholar.glb';
export const THATCHED_HUT_MODEL_PATH = '/models/buildings/thatched-hut.glb';
export const MEDIEVAL_HOUSE_MODEL_PATH = '/models/buildings/medieval-house.glb';

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
