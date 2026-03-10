import { CHARACTER_CONFIGS, type CharacterType } from '@/content/characters/characters';
import type { LevelConfig } from '@/content/levels/types';
import {
    MILESTONE_STRUCTURE_MODELS,
    OBSTACLE_MODELS,
    TRAVELING_SCHOLAR_MODEL_PATH,
} from '@/content/models/scene-models';
import { evictGLTFSceneModel, preloadGLTFSceneModel } from '@/shared/three/gltf-loader-extensions';

export const getLevelSceneModelPaths = (level: LevelConfig, selectedCharacter: CharacterType) => {
    const paths = new Set<string>();
    const playerModelPath = CHARACTER_CONFIGS[selectedCharacter].modelPath;

    if (playerModelPath) {
        paths.add(playerModelPath);
    }

    if (level.teachers.length > 0) {
        paths.add(TRAVELING_SCHOLAR_MODEL_PATH);
    }

    for (const milestone of level.milestones) {
        paths.add(MILESTONE_STRUCTURE_MODELS[milestone.buildingType].modelPath);
    }

    for (const obstacle of level.obstacles) {
        const obstacleModel = OBSTACLE_MODELS[obstacle.type];
        if (obstacleModel) {
            paths.add(obstacleModel.modelPath);
        }
    }

    return [...paths];
};

export const evictLevelSceneAssets = (level: LevelConfig, selectedCharacter: CharacterType) => {
    const sharedPaths = new Set<string>();
    const playerModelPath = CHARACTER_CONFIGS[selectedCharacter].modelPath;
    if (playerModelPath) {
        sharedPaths.add(playerModelPath);
    }

    if (level.teachers.length > 0) {
        sharedPaths.add(TRAVELING_SCHOLAR_MODEL_PATH);
    }

    for (const modelPath of getLevelSceneModelPaths(level, selectedCharacter)) {
        if (sharedPaths.has(modelPath)) {
            continue;
        }

        evictGLTFSceneModel(modelPath);
    }
};

export const preloadObstacleModelsForLevel = (level: Pick<LevelConfig, 'obstacles'>) => {
    const obstacleTypes = new Set(level.obstacles.map((obstacle) => obstacle.type));

    for (const obstacleType of obstacleTypes) {
        const obstacleModel = OBSTACLE_MODELS[obstacleType];
        if (obstacleModel) {
            preloadGLTFSceneModel(obstacleModel.modelPath);
        }
    }
};
