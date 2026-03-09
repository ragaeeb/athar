import {
    Bone,
    BoxGeometry,
    Float32BufferAttribute,
    Group,
    Mesh,
    MeshBasicMaterial,
    Skeleton,
    SkinnedMesh,
    Uint16BufferAttribute,
} from 'three';
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

    it('clones skinned scenes through the skinned-mesh path and normalizes them safely', () => {
        const geometry = new BoxGeometry(2, 4, 2);
        const positionAttribute = geometry.getAttribute('position');
        if (!positionAttribute) {
            throw new Error('BoxGeometry is missing a position attribute');
        }

        const vertexCount = positionAttribute.count;
        const skinIndices: number[] = [];
        const skinWeights: number[] = [];
        for (let index = 0; index < vertexCount; index += 1) {
            skinIndices.push(0, 0, 0, 0);
            skinWeights.push(1, 0, 0, 0);
        }
        geometry.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndices, 4));
        geometry.setAttribute('skinWeight', new Float32BufferAttribute(skinWeights, 4));
        const material = new MeshBasicMaterial({ color: '#ffffff' });
        disposables.push(geometry, material);

        const rootBone = new Bone();
        const childBone = new Bone();
        rootBone.add(childBone);
        rootBone.updateMatrixWorld(true);
        const skeleton = new Skeleton([rootBone, childBone]);
        disposables.push(skeleton);

        const sourceMesh = new SkinnedMesh(geometry, material);
        sourceMesh.add(rootBone);
        sourceMesh.bind(skeleton);

        const sourceScene = new Group();
        sourceScene.add(sourceMesh);

        const result = buildNormalizedSceneModel({
            materialCustomizer: undefined,
            materialMode: 'authored',
            scene: sourceScene,
            targetHeight: 8,
        });

        const clonedMesh = result.normalizedScene.children[0];
        expect(clonedMesh).toBeInstanceOf(SkinnedMesh);
        expect(clonedMesh).not.toBe(sourceMesh);
        expect((clonedMesh as SkinnedMesh).frustumCulled).toBe(false);
        expect(result.normalizedScale).toBeCloseTo(2, 5);
    });

    it('uses the zero-height safeguard when bounds height is effectively flat', () => {
        const geometry = new BoxGeometry(2, 0.0000001, 2);
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

        expect(result.normalizedScale).toBeCloseTo(8_000, 5);
        expect(result.sceneOffset[0]).toBeCloseTo(0, 5);
        expect(result.sceneOffset[1]).toBeCloseTo(0, 5);
        expect(result.sceneOffset[2]).toBeCloseTo(0, 5);
    });
});
