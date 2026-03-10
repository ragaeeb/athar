import { describe, expect, it, vi } from 'vitest';

import { level1 } from '@/content/levels/level-1/config';

vi.mock('@/shared/three/gltf-loader-extensions', () => ({
    evictGLTFSceneModel: vi.fn(),
}));

describe('level scene assets', () => {
    it('collects unique chapter model paths for the selected character and authored level content', async () => {
        const { getLevelSceneModelPaths } = await import('@/content/models/level-scene-assets');

        expect(getLevelSceneModelPaths(level1, 'bukhari')).toEqual([
            '/models/characters/player.glb',
            '/models/scholars/traveling-scholar.glb',
            '/models/buildings/thatched-hut.glb',
            '/models/buildings/medieval-house.glb',
            '/models/obstacles/viper.glb',
        ]);
    });

    it('evicts every collected chapter model path once', async () => {
        const { evictGLTFSceneModel } = await import('@/shared/three/gltf-loader-extensions');
        const { evictLevelSceneAssets } = await import('@/content/models/level-scene-assets');

        evictLevelSceneAssets(level1, 'bukhari');

        expect(evictGLTFSceneModel).toHaveBeenCalledTimes(5);
        expect(evictGLTFSceneModel).toHaveBeenNthCalledWith(1, '/models/characters/player.glb');
        expect(evictGLTFSceneModel).toHaveBeenNthCalledWith(2, '/models/scholars/traveling-scholar.glb');
        expect(evictGLTFSceneModel).toHaveBeenNthCalledWith(3, '/models/buildings/thatched-hut.glb');
        expect(evictGLTFSceneModel).toHaveBeenNthCalledWith(4, '/models/buildings/medieval-house.glb');
        expect(evictGLTFSceneModel).toHaveBeenNthCalledWith(5, '/models/obstacles/viper.glb');
    });
});
