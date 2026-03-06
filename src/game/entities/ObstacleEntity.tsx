import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import type { ObstacleConfig } from '@/game/levels/level.types';
import { OBSTACLE_VISUAL_SCALE } from '@/lib/constants';

type ObstacleEntityProps = {
    obstacle: ObstacleConfig;
};

export const ObstacleEntity = ({ obstacle }: ObstacleEntityProps) => {
    const groupRef = useRef<Group | null>(null);

    useFrame((state) => {
        if (!groupRef.current) {
            return;
        }

        groupRef.current.rotation.y = state.clock.elapsedTime * 0.55;
        if (obstacle.type === 'viper') {
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.4) * 0.2;
        }
    });

    if (obstacle.type === 'sandstorm') {
        return (
            <group ref={groupRef} scale={OBSTACLE_VISUAL_SCALE}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.8, 3.4, 48]} />
                    <meshStandardMaterial
                        color="#e9c46a"
                        transparent
                        opacity={0.3}
                        emissive="#f4a261"
                        emissiveIntensity={0.4}
                    />
                </mesh>
                <mesh position={[0, 1.4, 0]}>
                    <sphereGeometry args={[1.5, 18, 18]} />
                    <meshStandardMaterial
                        color="#cda15d"
                        transparent
                        opacity={0.18}
                        emissive="#dda15e"
                        emissiveIntensity={0.35}
                    />
                </mesh>
            </group>
        );
    }

    return (
        <group ref={groupRef} scale={OBSTACLE_VISUAL_SCALE}>
            {[-1.1, -0.5, 0.1, 0.7, 1.3].map((segment, index) => (
                <mesh
                    key={segment}
                    castShadow
                    position={[segment, Math.sin(index) * 0.18, 0]}
                    scale={[1, 0.55 + index * 0.08, 0.7]}
                >
                    <sphereGeometry args={[0.28, 16, 16]} />
                    <meshStandardMaterial color="#8b1e3f" emissive="#d62839" emissiveIntensity={0.55} />
                </mesh>
            ))}
            <mesh castShadow position={[1.4, 0.12, 0]}>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshStandardMaterial color="#f8f0dc" emissive="#ff6b6b" emissiveIntensity={1.1} />
            </mesh>
        </group>
    );
};
