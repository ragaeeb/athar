import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { DynamicDrawUsage, type InstancedMesh, Object3D } from 'three';

import type { TokenState } from '@/content/levels/types';
import { TOKEN_VISUAL_SCALE } from '@/shared/constants/gameplay';

type HadithTokenClusterInstancesProps = {
    tokens: TokenState[];
};

const BASE_TOKEN_HEIGHT = 1;
const BOB_HEIGHT = 0.26;
const ROTATION_SPEED = 1.4;

export const HadithTokenClusterInstances = ({ tokens }: HadithTokenClusterInstancesProps) => {
    const meshRef = useRef<InstancedMesh>(null);
    const transformRef = useRef(new Object3D());

    useEffect(() => {
        if (!meshRef.current) {
            return;
        }

        meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
    }, [tokens.length]);

    useFrame((state) => {
        const mesh = meshRef.current;
        const transform = transformRef.current;
        if (!mesh) {
            return;
        }

        for (const [index, token] of tokens.entries()) {
            transform.position.set(
                token.localOffsetMeters.x,
                BASE_TOKEN_HEIGHT + Math.sin(state.clock.elapsedTime * 1.8 + token.bounceSeed) * BOB_HEIGHT,
                token.localOffsetMeters.z,
            );
            transform.rotation.set(0, state.clock.elapsedTime * ROTATION_SPEED + token.bounceSeed, 0);
            transform.scale.setScalar(TOKEN_VISUAL_SCALE);
            transform.updateMatrix();
            mesh.setMatrixAt(index, transform.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, tokens.length]} frustumCulled={false}>
            <icosahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial color="#f4d35e" emissive="#f4d35e" emissiveIntensity={1.8} roughness={0.2} />
        </instancedMesh>
    );
};
