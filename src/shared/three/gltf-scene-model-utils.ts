import { Box3, type Material, Mesh, type Object3D, SkinnedMesh, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

import {
    type GLTFSceneMaterialCustomizer,
    type GLTFSceneMaterialMode,
    prepareGLTFMaterials,
} from '@/shared/three/gltf-materials';

export type NormalizedSceneModel = {
    normalizedScale: number;
    normalizedScene: Object3D;
    sceneOffset: [number, number, number];
};

export const cloneStaticScene = (sourceScene: Object3D) => {
    let hasSkinnedMeshes = false;
    sourceScene.traverse((child) => {
        if (child instanceof SkinnedMesh) {
            hasSkinnedMeshes = true;
        }
    });

    return hasSkinnedMeshes ? clone(sourceScene) : sourceScene.clone(true);
};

export const prepareSceneNode = (
    child: unknown,
    options: {
        materialCache: Map<Material, Material>;
        materialCustomizer: GLTFSceneMaterialCustomizer | undefined;
        materialMode: GLTFSceneMaterialMode | undefined;
    },
) => {
    if (typeof child === 'object' && child !== null && 'frustumCulled' in child) {
        child.frustumCulled = false;
    }

    if (!(child instanceof Mesh)) {
        return;
    }

    child.castShadow = false;
    child.receiveShadow = false;
    child.material = prepareGLTFMaterials(child.material, options);
};

export const buildNormalizedSceneModel = ({
    materialCustomizer,
    materialMode,
    scene,
    targetHeight,
}: {
    materialCustomizer: GLTFSceneMaterialCustomizer | undefined;
    materialMode: GLTFSceneMaterialMode | undefined;
    scene: Object3D;
    targetHeight: number;
}): NormalizedSceneModel => {
    const clonedScene = cloneStaticScene(scene);
    const materialCache = new Map<Material, Material>();
    clonedScene.traverse((child) =>
        prepareSceneNode(child, {
            materialCache,
            materialCustomizer,
            materialMode,
        }),
    );
    clonedScene.updateMatrixWorld(true);

    const bounds = new Box3().setFromObject(clonedScene);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const safeHeight = Math.max(size.y, 0.001);

    return {
        normalizedScale: targetHeight / safeHeight,
        normalizedScene: clonedScene,
        sceneOffset: [-center.x, -bounds.min.y, -center.z],
    };
};
