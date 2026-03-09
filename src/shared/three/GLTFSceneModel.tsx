import { useGLTF } from '@react-three/drei';
import { extendGLTFSceneLoader } from '@/shared/three/gltf-loader-extensions';
import type { GLTFSceneMaterialCustomizer, GLTFSceneMaterialMode } from '@/shared/three/gltf-materials';
import { buildNormalizedSceneModel } from '@/shared/three/gltf-scene-model-utils';

type GLTFSceneModelProps = {
    materialCustomizer?: GLTFSceneMaterialCustomizer;
    materialMode?: GLTFSceneMaterialMode;
    modelPath: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    targetHeight: number;
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
    const { normalizedScene, normalizedScale, sceneOffset } = buildNormalizedSceneModel({
        materialCustomizer,
        materialMode,
        scene: gltf.scene,
        targetHeight,
    });

    return (
        <group position={position} rotation={rotation} scale={normalizedScale}>
            <primitive object={normalizedScene} position={sceneOffset} />
        </group>
    );
};
