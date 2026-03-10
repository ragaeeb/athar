import {
    Bone,
    BoxGeometry,
    Float32BufferAttribute,
    Group,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Skeleton,
    SkinnedMesh,
    Texture,
    Uint16BufferAttribute,
} from 'three';
import { afterEach, describe, expect, it } from 'vitest';

import {
    buildNormalizedSceneModel,
    disposeGLTFSourceScene,
    disposeSceneModelInstance,
} from '@/shared/three/gltf-scene-model-utils';

describe('gltf-scene-model-utils', () => {
    const disposables: Array<{ dispose: () => void }> = [];

    const createSkinnedScene = () => {
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
        const rootBone = new Bone();
        const childBone = new Bone();
        rootBone.add(childBone);
        rootBone.updateMatrixWorld(true);
        const skeleton = new Skeleton([rootBone, childBone]);

        const sourceMesh = new SkinnedMesh(geometry, material);
        sourceMesh.add(rootBone);
        sourceMesh.bind(skeleton);

        const sourceScene = new Group();
        sourceScene.add(sourceMesh);

        disposables.push(geometry, material, skeleton);

        return {
            geometry,
            material,
            skeleton,
            sourceMesh,
            sourceScene,
        };
    };

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
        const { sourceMesh, sourceScene } = createSkinnedScene();

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

    it('can normalize flat ground models by footprint instead of height', () => {
        const geometry = new BoxGeometry(10, 0.5, 2);
        const material = new MeshBasicMaterial({ color: '#ffffff' });
        disposables.push(geometry, material);

        const sourceMesh = new Mesh(geometry, material);
        const sourceScene = new Group();
        sourceScene.add(sourceMesh);

        const result = buildNormalizedSceneModel({
            materialCustomizer: undefined,
            materialMode: 'authored',
            scene: sourceScene,
            targetFootprint: 5,
            targetHeight: 8,
        });

        expect(result.normalizedScale).toBeCloseTo(0.5, 5);
        expect(result.sceneOffset[0]).toBeCloseTo(0, 5);
        expect(result.sceneOffset[1]).toBeCloseTo(0.25, 5);
        expect(result.sceneOffset[2]).toBeCloseTo(0, 5);
    });

    it('returns finite normalization values for an empty scene', () => {
        const sourceScene = new Group();

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
        expect(result.sceneOffset.every(Number.isFinite)).toBe(true);
    });

    it('returns finite normalization values for camera-only scenes', () => {
        const sourceScene = new Group();
        const camera = new PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 4, 8);
        sourceScene.add(camera);

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
        expect(result.sceneOffset.every(Number.isFinite)).toBe(true);
    });

    it('disposes instance-owned materials and skeletons without touching shared geometry or textures', () => {
        const { geometry, material, sourceScene } = createSkinnedScene();
        const map = new Texture();
        material.map = map;
        disposables.push(map);

        const result = buildNormalizedSceneModel({
            materialCustomizer: undefined,
            materialMode: 'authored',
            scene: sourceScene,
            targetHeight: 8,
        });

        const clonedMesh = result.normalizedScene.children[0] as SkinnedMesh;
        const clonedMaterial = clonedMesh.material as MeshBasicMaterial;
        const clonedSkeleton = clonedMesh.skeleton;

        const materialDispose = clonedMaterial.dispose;
        const skeletonDispose = clonedSkeleton.dispose;

        let materialDisposeCount = 0;
        let skeletonDisposeCount = 0;

        clonedMaterial.dispose = () => {
            materialDisposeCount += 1;
            materialDispose.call(clonedMaterial);
        };
        clonedSkeleton.dispose = () => {
            skeletonDisposeCount += 1;
            skeletonDispose.call(clonedSkeleton);
        };

        let geometryDisposeCount = 0;
        let textureDisposeCount = 0;
        const sharedGeometryDispose = geometry.dispose;
        const sharedTextureDispose = map.dispose;
        geometry.dispose = () => {
            geometryDisposeCount += 1;
            sharedGeometryDispose.call(geometry);
        };
        map.dispose = () => {
            textureDisposeCount += 1;
            sharedTextureDispose.call(map);
        };

        disposeSceneModelInstance(result.normalizedScene);

        expect(materialDisposeCount).toBe(1);
        expect(skeletonDisposeCount).toBe(1);
        expect(geometryDisposeCount).toBe(0);
        expect(textureDisposeCount).toBe(0);
    });

    it('disposes shared source geometry, materials, textures, and skeletons on source-scene eviction', () => {
        const { geometry, material, skeleton, sourceScene } = createSkinnedScene();
        const map = new Texture();
        material.map = map;
        disposables.push(map);

        let geometryDisposeCount = 0;
        let materialDisposeCount = 0;
        let textureDisposeCount = 0;
        let skeletonDisposeCount = 0;
        const geometryDispose = geometry.dispose;
        const materialDispose = material.dispose;
        const textureDispose = map.dispose;
        const skeletonDispose = skeleton.dispose;

        geometry.dispose = () => {
            geometryDisposeCount += 1;
            geometryDispose.call(geometry);
        };
        material.dispose = () => {
            materialDisposeCount += 1;
            materialDispose.call(material);
        };
        map.dispose = () => {
            textureDisposeCount += 1;
            textureDispose.call(map);
        };
        skeleton.dispose = () => {
            skeletonDisposeCount += 1;
            skeletonDispose.call(skeleton);
        };

        disposeGLTFSourceScene(sourceScene);

        expect(geometryDisposeCount).toBe(1);
        expect(materialDisposeCount).toBe(1);
        expect(textureDisposeCount).toBe(1);
        expect(skeletonDisposeCount).toBe(1);
    });
});
