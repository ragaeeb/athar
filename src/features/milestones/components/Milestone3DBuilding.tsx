import type { MilestoneConfig } from '@/content/levels/types';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { MILESTONE_VISUAL_SCALE } from '@/shared/constants/gameplay';

type Milestone3DBuildingProps = {
    milestone: MilestoneConfig;
};

const palette = {
    accent: '#f4d35e',
    base: '#c8b28b',
    done: '#669bbc',
};

export const Milestone3DBuilding = ({ milestone }: Milestone3DBuildingProps) => {
    const completed = useLevelStore((s) => s.completedMilestoneIds.includes(milestone.id));
    const color = completed ? palette.done : palette.base;
    const emissive = completed ? palette.done : palette.accent;

    if (milestone.buildingType === 'market') {
        return (
            <group scale={MILESTONE_VISUAL_SCALE}>
                <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
                    <boxGeometry args={[3.2, 1.6, 2.4]} />
                    <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.18} />
                </mesh>
                <mesh castShadow position={[0, 1.95, 0]}>
                    <coneGeometry args={[2.1, 1.3, 4]} />
                    <meshStandardMaterial color="#8c6a43" />
                </mesh>
            </group>
        );
    }

    if (milestone.buildingType === 'minaret') {
        return (
            <group scale={MILESTONE_VISUAL_SCALE}>
                <mesh castShadow receiveShadow position={[0, 1.6, 0]}>
                    <cylinderGeometry args={[0.6, 1, 3.2, 12]} />
                    <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.22} />
                </mesh>
                <mesh castShadow position={[0, 3.8, 0]}>
                    <coneGeometry args={[0.8, 1.2, 10]} />
                    <meshStandardMaterial color="#8c6a43" />
                </mesh>
            </group>
        );
    }

    if (milestone.buildingType === 'caravanserai') {
        return (
            <group scale={MILESTONE_VISUAL_SCALE}>
                <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
                    <boxGeometry args={[4, 1.4, 2.4]} />
                    <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.18} />
                </mesh>
                <mesh castShadow position={[0, 1.8, 0]}>
                    <boxGeometry args={[2.2, 0.8, 1.4]} />
                    <meshStandardMaterial color="#8c6a43" />
                </mesh>
            </group>
        );
    }

    return (
        <group scale={MILESTONE_VISUAL_SCALE}>
            <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
                <boxGeometry args={[3, 1.8, 3]} />
                <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
            </mesh>
            <mesh castShadow position={[0, 2.25, 0]}>
                <sphereGeometry args={[1.2, 24, 24]} />
                <meshStandardMaterial color="#907045" />
            </mesh>
            <mesh castShadow position={[0, 3.5, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 1, 8]} />
                <meshStandardMaterial color="#f8f0dc" />
            </mesh>
        </group>
    );
};
