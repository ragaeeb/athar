import type { MilestoneConfig } from '@/content/levels/types';
import { MILESTONE_STRUCTURE_MODELS } from '@/content/models/scene-models';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { MILESTONE_VISUAL_SCALE } from '@/shared/constants/gameplay';
import { GLTFSceneModel } from '@/shared/three/GLTFSceneModel';
import { preloadGLTFSceneModel } from '@/shared/three/gltf-loader-extensions';

type Milestone3DBuildingProps = {
    milestone: MilestoneConfig;
};

const palette = {
    accent: '#f4d35e',
    done: '#669bbc',
};

export const Milestone3DBuilding = ({ milestone }: Milestone3DBuildingProps) => {
    const completed = useLevelStore((s) => s.completedMilestoneIds.includes(milestone.id));
    const emissive = completed ? palette.done : palette.accent;
    const modelConfig = MILESTONE_STRUCTURE_MODELS[milestone.buildingType];

    return (
        <group scale={MILESTONE_VISUAL_SCALE}>
            <GLTFSceneModel
                materialMode="unlit"
                modelPath={modelConfig.modelPath}
                rotation={[0, modelConfig.rotationY, 0]}
                targetHeight={modelConfig.targetHeight}
            />
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
                <torusGeometry args={[1.45, 0.08, 12, 40]} />
                <meshStandardMaterial color={emissive} emissive={emissive} emissiveIntensity={0.7} />
            </mesh>
            <mesh castShadow position={[0, modelConfig.targetHeight + 0.45, 0]}>
                <sphereGeometry args={[0.18, 18, 18]} />
                <meshStandardMaterial color={emissive} emissive={emissive} emissiveIntensity={0.95} />
            </mesh>
        </group>
    );
};

for (const { modelPath } of Object.values(MILESTONE_STRUCTURE_MODELS)) {
    preloadGLTFSceneModel(modelPath);
}
