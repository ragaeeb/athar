import { Billboard, Text, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, MeshStandardMaterial } from 'three';
import type { TeacherConfig } from '@/content/levels/types';
import { TRAVELING_SCHOLAR_MODEL_PATH } from '@/content/models/scene-models';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { TEACHER_VISUAL_SCALE } from '@/shared/constants/gameplay';
import { GLTFSceneModel } from '@/shared/three/GLTFSceneModel';

type TeacherNPCProps = {
    teacher: TeacherConfig;
};

const styleScholarMaterial = (material: MeshStandardMaterial) => {
    const materialName = material.name.toLowerCase();

    if (materialName.includes('head') || materialName.includes('hand')) {
        material.color.set('#c58e67');
        material.emissive.set('#8c6047');
        return;
    }

    if (materialName.includes('outer')) {
        material.color.set('#7388a3');
        material.emissive.set('#43566d');
        return;
    }

    if (materialName.includes('inner') || materialName.includes('syal')) {
        material.color.set('#dcc9a1');
        material.emissive.set('#8f7b56');
        return;
    }

    if (materialName.includes('pants')) {
        material.color.set('#29324d');
        material.emissive.set('#1d2336');
        return;
    }

    if (
        materialName.includes('belt') ||
        materialName.includes('shoe') ||
        materialName.includes('hat') ||
        materialName.includes('revolver')
    ) {
        material.color.set('#36271b');
        material.emissive.set('#24190f');
        return;
    }

    if (materialName.includes('gold')) {
        material.color.set('#b9923c');
        material.emissive.set('#7f5d1d');
    }
};

export const TeacherNPC = ({ teacher }: TeacherNPCProps) => {
    const completed = useLevelStore((s) => s.completedTeacherIds.includes(teacher.id));
    const groupRef = useRef<Group | null>(null);

    useFrame((state) => {
        if (!groupRef.current) {
            return;
        }

        groupRef.current.position.y = 1.2 + Math.sin(state.clock.elapsedTime * 1.2) * 0.18;
    });

    return (
        <group ref={groupRef} scale={TEACHER_VISUAL_SCALE}>
            <GLTFSceneModel
                materialCustomizer={styleScholarMaterial}
                modelPath={TRAVELING_SCHOLAR_MODEL_PATH}
                rotation={[0, Math.PI, 0]}
                targetHeight={2.6}
            />
            <mesh position={[0, 1.55, 0]}>
                <torusGeometry args={[0.85, 0.08, 12, 32]} />
                <meshStandardMaterial
                    color={completed ? '#8f9fa7' : '#f4d35e'}
                    emissive={completed ? '#64748b' : '#f4d35e'}
                    emissiveIntensity={completed ? 0.3 : 0.9}
                />
            </mesh>
            <Billboard position={[0, 3, 0]}>
                <Text
                    color="#f8f0dc"
                    fontSize={0.45}
                    anchorX="center"
                    anchorY="middle"
                    outlineColor="#071118"
                    outlineWidth={0.04}
                >
                    {teacher.name}
                </Text>
            </Billboard>
        </group>
    );
};

useGLTF.preload(TRAVELING_SCHOLAR_MODEL_PATH);
