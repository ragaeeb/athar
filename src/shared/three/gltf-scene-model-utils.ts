import { Box3, Material, Mesh, type Object3D, SkinnedMesh, type Texture, Vector3 } from 'three';
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

const isDisposableTexture = (value: unknown): value is Texture =>
    typeof value === 'object' && value !== null && 'isTexture' in value && value.isTexture === true;

const disposeMaterialTextures = (material: Material, disposedTextures: Set<Texture>) => {
    for (const value of Object.values(material)) {
        if (!isDisposableTexture(value) || disposedTextures.has(value)) {
            continue;
        }

        value.dispose();
        disposedTextures.add(value);
    }
};

const disposeMeshMaterials = (mesh: Mesh, disposedMaterials: Set<Material>) => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
        if (!(material instanceof Material) || disposedMaterials.has(material)) {
            continue;
        }

        material.dispose();
        disposedMaterials.add(material);
    }
};

const disposeSceneMaterialsAndSkeletons = (scene: Object3D) => {
    const disposedMaterials = new Set<Material>();
    const disposedSkeletons = new Set<unknown>();

    scene.traverse((child) => {
        if (child instanceof Mesh) {
            disposeMeshMaterials(child, disposedMaterials);
        }

        if (child instanceof SkinnedMesh && !disposedSkeletons.has(child.skeleton)) {
            child.skeleton.dispose();
            disposedSkeletons.add(child.skeleton);
        }
    });
};

export const disposeSceneModelInstance = (scene: Object3D) => {
    disposeSceneMaterialsAndSkeletons(scene);
};

export const disposeGLTFSourceScene = (scene: Object3D) => {
    const disposedGeometries = new Set<unknown>();
    const disposedTextures = new Set<Texture>();

    scene.traverse((child) => {
        if (child instanceof Mesh && !disposedGeometries.has(child.geometry)) {
            child.geometry.dispose();
            disposedGeometries.add(child.geometry);
        }
    });

    scene.traverse((child) => {
        if (!(child instanceof Mesh)) {
            return;
        }

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) {
            if (!(material instanceof Material)) {
                continue;
            }

            disposeMaterialTextures(material, disposedTextures);
        }
    });

    disposeSceneMaterialsAndSkeletons(scene);
};

export const cloneStaticScene = (sourceScene: Object3D) => {
    let hasSkinnedMeshes = false;
    sourceScene.traverse((child) => {
        if (hasSkinnedMeshes) {
            return;
        }

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
    targetFootprint,
    targetHeight,
}: {
    materialCustomizer: GLTFSceneMaterialCustomizer | undefined;
    materialMode: GLTFSceneMaterialMode | undefined;
    scene: Object3D;
    targetFootprint?: number;
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

    const bounds = new Box3().setFromObject(clonedScene, true);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const safeHeight = Math.max(size.y, 0.001);
    const safeFootprint = Math.max(size.x, size.z, 0.001);
    const minY = bounds.isEmpty() || !Number.isFinite(bounds.min.y) ? 0 : bounds.min.y;

    return {
        normalizedScale: targetFootprint ? targetFootprint / safeFootprint : targetHeight / safeHeight,
        normalizedScene: clonedScene,
        sceneOffset: [-center.x, -minY, -center.z],
    };
};
