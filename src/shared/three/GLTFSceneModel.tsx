import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Box3, type Material, Mesh, type Object3D, SkinnedMesh, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { extendGLTFSceneLoader } from '@/shared/three/gltf-loader-extensions';
import {
    type GLTFSceneMaterialCustomizer,
    type GLTFSceneMaterialMode,
    prepareGLTFMaterials,
} from '@/shared/three/gltf-materials';

type GLTFSceneModelProps = {
    materialCustomizer?: GLTFSceneMaterialCustomizer;
    materialMode?: GLTFSceneMaterialMode;
    modelPath: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    targetHeight: number;
};

const cloneStaticScene = (sourceScene: Object3D) => {
    let hasSkinnedMeshes = false;
    sourceScene.traverse((child) => {
        if (child instanceof SkinnedMesh) {
            hasSkinnedMeshes = true;
        }
    });

    return hasSkinnedMeshes ? clone(sourceScene) : sourceScene.clone(true);
};

const prepareSceneNode = (
    child: unknown,
    options: {
        materialCache: Map<Material, Material>;
        materialCustomizer?: GLTFSceneMaterialCustomizer | undefined;
        materialMode?: GLTFSceneMaterialMode | undefined;
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

export const GLTFSceneModel = ({
    materialCustomizer,
    materialMode = 'authored',
    modelPath,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    targetHeight,
}: GLTFSceneModelProps) => {
    const gltf = useGLTF(modelPath, true, true, extendGLTFSceneLoader);
    const { normalizedScene, normalizedScale, sceneOffset } = useMemo(() => {
        const clonedScene = cloneStaticScene(gltf.scene);
        const materialCache = new Map();
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
            sceneOffset: [-center.x, -bounds.min.y, -center.z] as [number, number, number],
        };
    }, [gltf.scene, materialCustomizer, materialMode, targetHeight]);

    return (
        <group position={position} rotation={rotation} scale={normalizedScale}>
            <primitive object={normalizedScene} position={sceneOffset} />
        </group>
    );
};
