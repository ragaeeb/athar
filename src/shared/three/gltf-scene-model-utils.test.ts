import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { afterEach, describe, expect, it } from 'vitest';

import { buildNormalizedSceneModel } from '@/shared/three/gltf-scene-model-utils';

describe('gltf-scene-model-utils', () => {
    const disposables: Array<{ dispose: () => void }> = [];

    afterEach(() => {
        for (const disposable of disposables) {
            disposable.dispose();
        }
        disposables.length = 0;
    });

    it('clones and normalizes a static scene without mutating the source mesh', () => {
        const geometry = new BoxGeometry(2, 4, 2);
        const material = new MeshBasicMaterial({ color: '#ffffff' });
        disposables.push(geometry, material);

        const sourceMesh = new Mesh(geometry, material);
        const sourceScene = new Group();
        sourceScene.add(sourceMesh);

        const result = buildNormalizedSceneModel({
            materialCustomizer: undefined,
            materialMode: 'authored',
            scene: sourceScene,
            targetHeight: 8,
        });

        expect(result.normalizedScene).not.toBe(sourceScene);
        expect(result.normalizedScale).toBeCloseTo(2, 5);
        expect(result.sceneOffset[0]).toBeCloseTo(0, 5);
        expect(result.sceneOffset[1]).toBeCloseTo(2, 5);
        expect(result.sceneOffset[2]).toBeCloseTo(0, 5);
        expect(sourceMesh.frustumCulled).toBe(true);

        const clonedMesh = result.normalizedScene.children[0];
        expect(clonedMesh).toBeInstanceOf(Mesh);
        expect((clonedMesh as Mesh).frustumCulled).toBe(false);
    });
});
