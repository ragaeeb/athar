import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import { extendGLTFSceneLoader, registerGLTFSceneModelSource } from '@/shared/three/gltf-loader-extensions';
import type { GLTFSceneMaterialCustomizer, GLTFSceneMaterialMode } from '@/shared/three/gltf-materials';
import { buildNormalizedSceneModel, disposeSceneModelInstance } from '@/shared/three/gltf-scene-model-utils';

type GLTFSceneModelProps = {
    materialCustomizer?: GLTFSceneMaterialCustomizer;
    materialMode?: GLTFSceneMaterialMode;
    modelPath: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    targetHeight: number;
    targetFootprint?: number;
};

export const GLTFSceneModel = ({
    materialCustomizer,
    materialMode = 'authored',
    modelPath,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    targetHeight,
    targetFootprint,
}: GLTFSceneModelProps) => {
    const gltf = useGLTF(modelPath, true, true, extendGLTFSceneLoader);
    const { normalizedScene, normalizedScale, sceneOffset } = buildNormalizedSceneModel({
        materialCustomizer,
        materialMode,
        scene: gltf.scene,
        targetHeight,
        ...(targetFootprint ? { targetFootprint } : {}),
    });

    useEffect(() => {
        registerGLTFSceneModelSource(modelPath, gltf.scene);
    }, [gltf.scene, modelPath]);

    useEffect(
        () => () => {
            disposeSceneModelInstance(normalizedScene);
        },
        [normalizedScene],
    );

    return (
        <group position={position} rotation={rotation} scale={normalizedScale}>
            <primitive object={normalizedScene} position={sceneOffset} />
        </group>
    );
};
