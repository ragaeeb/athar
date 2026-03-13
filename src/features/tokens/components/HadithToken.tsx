import { a, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import type { TokenState } from '@/content/levels/types';
import { TOKEN_VISUAL_SCALE } from '@/shared/constants/gameplay';

type HadithTokenProps = {
    token: TokenState;
};

export const HadithToken = ({ token }: HadithTokenProps) => {
    const groupRef = useRef<Group | null>(null);
    const spring = useSpring({
        config: {
            friction: 16,
            tension: 180,
        },
        from: {
            scale: token.kind === 'scattered' ? 1.3 : 1,
            y: token.kind === 'scattered' ? 0.35 : 0.9,
        },
        to: {
            scale: 1,
            y: token.kind === 'scattered' ? 1.2 : 1,
        },
    });

    useFrame((state) => {
        if (!groupRef.current) {
            return;
        }

        groupRef.current.rotation.y = state.clock.elapsedTime * 1.4 + token.bounceSeed;
    });

    return (
        <a.group ref={groupRef} position-y={spring.y} scale={spring.scale.to((value) => value * TOKEN_VISUAL_SCALE)}>
            <mesh castShadow>
                <icosahedronGeometry args={[0.52, 0]} />
                <meshStandardMaterial
                    color="#3a2a14"
                    emissive="#24190c"
                    emissiveIntensity={0.5}
                    roughness={0.6}
                    metalness={0.1}
                />
            </mesh>
            <mesh castShadow>
                <icosahedronGeometry args={[0.45, 0]} />
                <meshStandardMaterial
                    color="#e2b04f"
                    emissive="#8a4e12"
                    emissiveIntensity={0.55}
                    roughness={0.25}
                    metalness={0.3}
                />
            </mesh>
        </a.group>
    );
};
