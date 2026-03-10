import { describe, expect, it, vi } from 'vitest';
import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { level1 } from '@/content/levels/level-1/config';
import {
    MILESTONE_STRUCTURE_MODELS,
    OBSTACLE_MODELS,
    TRAVELING_SCHOLAR_MODEL_PATH,
} from '@/content/models/scene-models';

vi.mock('@/shared/three/gltf-loader-extensions', () => ({
    evictGLTFSceneModel: vi.fn(),
    preloadGLTFSceneModel: vi.fn(),
}));

const selectedCharacter = 'bukhari' as const;

const getExpectedSceneModelPaths = () => {
    const expected = new Set<string>();
    const playerModelPath = CHARACTER_CONFIGS[selectedCharacter].modelPath;

    if (playerModelPath) {
        expected.add(playerModelPath);
    }

    if (level1.teachers.length > 0) {
        expected.add(TRAVELING_SCHOLAR_MODEL_PATH);
    }

    for (const milestone of level1.milestones) {
        expected.add(MILESTONE_STRUCTURE_MODELS[milestone.buildingType].modelPath);
    }

    for (const obstacle of level1.obstacles) {
        const obstacleModel = OBSTACLE_MODELS[obstacle.type];
        if (obstacleModel) {
            expected.add(obstacleModel.modelPath);
        }
    }

    return [...expected];
};

describe('level scene assets', () => {
    it('collects unique chapter model paths for the selected character and authored level content', async () => {
        const { getLevelSceneModelPaths } = await import('@/content/models/level-scene-assets');
        const collectedPaths = getLevelSceneModelPaths(level1, selectedCharacter);
        const expectedPaths = getExpectedSceneModelPaths();

        expect(collectedPaths).toHaveLength(expectedPaths.length);
        expect(new Set(collectedPaths)).toEqual(new Set(expectedPaths));
    });

    it('evicts every collected chapter model path once', async () => {
        const { evictGLTFSceneModel } = await import('@/shared/three/gltf-loader-extensions');
        const { evictLevelSceneAssets } = await import('@/content/models/level-scene-assets');
        const expectedPaths = getExpectedSceneModelPaths().filter(
            (modelPath) =>
                modelPath !== CHARACTER_CONFIGS[selectedCharacter].modelPath &&
                modelPath !== TRAVELING_SCHOLAR_MODEL_PATH,
        );

        evictLevelSceneAssets(level1, selectedCharacter);

        expect(evictGLTFSceneModel).toHaveBeenCalledTimes(expectedPaths.length);
        expect(new Set(vi.mocked(evictGLTFSceneModel).mock.calls.map(([modelPath]) => modelPath))).toEqual(
            new Set(expectedPaths),
        );
    });

    it('preloads only authored obstacle models for the active chapter', async () => {
        const { preloadGLTFSceneModel } = await import('@/shared/three/gltf-loader-extensions');
        const { preloadObstacleModelsForLevel } = await import('@/content/models/level-scene-assets');

        preloadObstacleModelsForLevel(level1);

        const expectedObstaclePaths = new Set(
            level1.obstacles
                .map((obstacle) => OBSTACLE_MODELS[obstacle.type]?.modelPath)
                .filter((modelPath): modelPath is string => Boolean(modelPath)),
        );

        expect(preloadGLTFSceneModel).toHaveBeenCalledTimes(expectedObstaclePaths.size);
        expect(new Set(vi.mocked(preloadGLTFSceneModel).mock.calls.map(([modelPath]) => modelPath))).toEqual(
            expectedObstaclePaths,
        );
    });
});
