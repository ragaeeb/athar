import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import type { TeacherConfig } from '@/game/levels/level.types';
import { useLevelStore } from '@/game/store/level.store';
import { TEACHER_VISUAL_SCALE } from '@/lib/constants';

type TeacherNPCProps = {
    teacher: TeacherConfig;
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
            <mesh castShadow>
                <capsuleGeometry args={[0.5, 1.8, 8, 14]} />
                <meshStandardMaterial
                    color={completed ? '#8f9fa7' : '#60a5fa'}
                    emissive={completed ? '#64748b' : '#8ecae6'}
                    emissiveIntensity={completed ? 0.25 : 0.9}
                />
            </mesh>
            <mesh position={[0, 1.3, 0]}>
                <torusGeometry args={[0.85, 0.08, 12, 32]} />
                <meshStandardMaterial color="#f4d35e" emissive="#f4d35e" emissiveIntensity={0.9} />
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
