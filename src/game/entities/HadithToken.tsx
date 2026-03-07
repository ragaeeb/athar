import { a, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import type { TokenState } from '@/game/levels/level.types';
import { TOKEN_VISUAL_SCALE } from '@/lib/constants';

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
                <icosahedronGeometry args={[0.45, 0]} />
                <meshStandardMaterial color="#f4d35e" emissive="#f4d35e" emissiveIntensity={1.8} roughness={0.2} />
            </mesh>
        </a.group>
    );
};
