import { useFrame } from '@react-three/fiber';
import type { RefObject } from 'react';
import { useRef } from 'react';
import type { Group } from 'three';

import type { ObstacleConfig } from '@/content/levels/types';
import { OBSTACLE_MODELS } from '@/content/models/scene-models';
import { getPlayerRuntimeState } from '@/features/gameplay/runtime/player-runtime';
import { getSimulationNowMs } from '@/features/gameplay/runtime/simulation-clock';
import { resolveObstaclePatrolOffsetMeters } from '@/features/gameplay/simulation/systems/obstacle-patrol';
import { getObstacleVisualDescriptor, resolveObstacleOrbitPosition } from '@/features/obstacles/lib/obstacle-visuals';
import { OBSTACLE_VISUAL_SCALE } from '@/shared/constants/gameplay';
import { metersOffsetFromCoords } from '@/shared/geo';
import { GLTFSceneModel } from '@/shared/three/GLTFSceneModel';
import { preloadGLTFSceneModel } from '@/shared/three/gltf-loader-extensions';

type ObstacleEntityProps = {
    obstacle: ObstacleConfig;
};

const FloodVisual = ({ obstacle }: Pick<ObstacleEntityProps, 'obstacle'>) => {
    const descriptor = getObstacleVisualDescriptor(obstacle);

    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.6, 3.3, 48]} />
                <meshStandardMaterial
                    color={descriptor.accentColor}
                    emissive={descriptor.emissiveColor}
                    emissiveIntensity={0.45}
                    opacity={0.35}
                    transparent
                />
            </mesh>
            <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.5, 0.2, 16, 40]} />
                <meshStandardMaterial color={descriptor.bodyColor} emissive={descriptor.emissiveColor} />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.55, 0.85, 0.9, 24]} />
                <meshStandardMaterial color={descriptor.bodyColor} emissive={descriptor.emissiveColor} />
            </mesh>
        </>
    );
};

const createObstacleModelProps = (modelConfig: {
    modelPath: string;
    rotationY: number;
    targetFootprint?: number;
    targetHeight: number;
}) => ({
    modelPath: modelConfig.modelPath,
    rotation: [0, modelConfig.rotationY, 0] as [number, number, number],
    targetHeight: modelConfig.targetHeight,
    ...(modelConfig.targetFootprint ? { targetFootprint: modelConfig.targetFootprint } : {}),
});

const GuardVisual = ({ markerRef, obstacle }: { markerRef: RefObject<Group | null>; obstacle: ObstacleConfig }) => {
    const descriptor = getObstacleVisualDescriptor(obstacle);
    const modelConfig = OBSTACLE_MODELS.guard;

    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.8, 3.1, 48]} />
                <meshStandardMaterial
                    color={descriptor.accentColor}
                    emissive={descriptor.emissiveColor}
                    emissiveIntensity={0.55}
                    opacity={0.32}
                    transparent
                />
            </mesh>
            <group ref={markerRef}>
                {modelConfig ? (
                    <GLTFSceneModel {...createObstacleModelProps(modelConfig)} />
                ) : (
                    <>
                        <mesh castShadow position={[0, 1.15, 0]}>
                            <cylinderGeometry args={[0.25, 0.32, 1.9, 12]} />
                            <meshStandardMaterial color={descriptor.bodyColor} emissive={descriptor.emissiveColor} />
                        </mesh>
                        <mesh castShadow position={[0, 2.1, 0]}>
                            <coneGeometry args={[0.38, 0.9, 10]} />
                            <meshStandardMaterial color={descriptor.accentColor} emissive={descriptor.emissiveColor} />
                        </mesh>
                    </>
                )}
            </group>
        </>
    );
};

const RivalVisual = ({ markerRef, obstacle }: { markerRef: RefObject<Group | null>; obstacle: ObstacleConfig }) => {
    const descriptor = getObstacleVisualDescriptor(obstacle);
    const modelConfig = OBSTACLE_MODELS.rival;

    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.6, 2.8, 40]} />
                <meshStandardMaterial
                    color={descriptor.accentColor}
                    emissive={descriptor.emissiveColor}
                    emissiveIntensity={0.45}
                    opacity={0.28}
                    transparent
                />
            </mesh>
            <group ref={markerRef}>
                {modelConfig ? (
                    <GLTFSceneModel {...createObstacleModelProps(modelConfig)} />
                ) : (
                    [-0.5, 0, 0.5].map((offset, index) => (
                        <mesh
                            key={offset}
                            castShadow
                            position={[offset, 0.9 + index * 0.4, 0]}
                            rotation={[0.2, 0.4, 0.2]}
                        >
                            <octahedronGeometry args={[0.34, 0]} />
                            <meshStandardMaterial color={descriptor.bodyColor} emissive={descriptor.emissiveColor} />
                        </mesh>
                    ))
                )}
            </group>
        </>
    );
};

const SandstormVisual = ({ obstacle }: Pick<ObstacleEntityProps, 'obstacle'>) => {
    const descriptor = getObstacleVisualDescriptor(obstacle);

    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.8, 3.4, 48]} />
                <meshStandardMaterial
                    color={descriptor.accentColor}
                    emissive={descriptor.emissiveColor}
                    emissiveIntensity={0.4}
                    opacity={0.3}
                    transparent
                />
            </mesh>
            <mesh position={[0, 1.4, 0]}>
                <sphereGeometry args={[1.5, 18, 18]} />
                <meshStandardMaterial
                    color={descriptor.bodyColor}
                    emissive={descriptor.emissiveColor}
                    emissiveIntensity={0.35}
                    opacity={0.18}
                    transparent
                />
            </mesh>
        </>
    );
};

const ScorpionVisual = ({ markerRef, obstacle }: { markerRef: RefObject<Group | null>; obstacle: ObstacleConfig }) => {
    const descriptor = getObstacleVisualDescriptor(obstacle);
    const modelConfig = OBSTACLE_MODELS.scorpion;

    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.4, 2.8, 40]} />
                <meshStandardMaterial
                    color={descriptor.accentColor}
                    emissive={descriptor.emissiveColor}
                    emissiveIntensity={0.45}
                    opacity={0.28}
                    transparent
                />
            </mesh>
            <group ref={markerRef}>
                {modelConfig ? (
                    <GLTFSceneModel {...createObstacleModelProps(modelConfig)} />
                ) : (
                    <>
                        <mesh castShadow position={[0, 0.45, 0]} scale={[1.4, 0.7, 0.9]}>
                            <sphereGeometry args={[0.48, 18, 18]} />
                            <meshStandardMaterial color={descriptor.bodyColor} emissive={descriptor.emissiveColor} />
                        </mesh>
                        <mesh castShadow position={[0.72, 0.52, 0]} scale={[0.85, 0.55, 0.6]}>
                            <sphereGeometry args={[0.28, 16, 16]} />
                            <meshStandardMaterial color={descriptor.accentColor} emissive={descriptor.emissiveColor} />
                        </mesh>
                        {[-0.75, -0.35, 0.15, 0.55].flatMap((zOffset, index) =>
                            [-1, 1].map((side) => (
                                <mesh
                                    key={`${side}-${zOffset}`}
                                    castShadow
                                    position={[side * 0.72, 0.18, zOffset]}
                                    rotation={[0, 0, side * (0.7 + index * 0.08)]}
                                >
                                    <capsuleGeometry args={[0.1, 0.7, 6, 10]} />
                                    <meshStandardMaterial
                                        color={descriptor.bodyColor}
                                        emissive={descriptor.emissiveColor}
                                    />
                                </mesh>
                            )),
                        )}
                        <mesh castShadow position={[-0.82, 0.98, 0]} rotation={[0, 0, -0.95]}>
                            <capsuleGeometry args={[0.12, 1.35, 8, 12]} />
                            <meshStandardMaterial color={descriptor.bodyColor} emissive={descriptor.emissiveColor} />
                        </mesh>
                        <mesh castShadow position={[-1.25, 1.55, 0.12]} rotation={[0.15, 0, -0.25]}>
                            <sphereGeometry args={[0.16, 12, 12]} />
                            <meshStandardMaterial
                                color={descriptor.accentColor}
                                emissive="#ffb703"
                                emissiveIntensity={0.9}
                            />
                        </mesh>
                    </>
                )}
            </group>
        </>
    );
};

const ViperVisual = ({ obstacle }: Pick<ObstacleEntityProps, 'obstacle'>) => {
    const descriptor = getObstacleVisualDescriptor(obstacle);
    const modelConfig = OBSTACLE_MODELS.viper;

    return (
        <>
            {modelConfig ? (
                <GLTFSceneModel {...createObstacleModelProps(modelConfig)} />
            ) : (
                <>
                    {[-1.1, -0.5, 0.1, 0.7, 1.3].map((segment, index) => (
                        <mesh
                            key={segment}
                            castShadow
                            position={[segment, Math.sin(index) * 0.18, 0]}
                            scale={[1, 0.55 + index * 0.08, 0.7]}
                        >
                            <sphereGeometry args={[0.28, 16, 16]} />
                            <meshStandardMaterial
                                color={descriptor.bodyColor}
                                emissive={descriptor.emissiveColor}
                                emissiveIntensity={0.55}
                            />
                        </mesh>
                    ))}
                    <mesh castShadow position={[1.4, 0.12, 0]}>
                        <sphereGeometry args={[0.22, 16, 16]} />
                        <meshStandardMaterial
                            color={descriptor.accentColor}
                            emissive="#ff6b6b"
                            emissiveIntensity={1.1}
                        />
                    </mesh>
                </>
            )}
        </>
    );
};

const updateObstacleVerticalOffset = (group: Group, obstacle: ObstacleConfig, elapsedTime: number) => {
    if (obstacle.type === 'viper') {
        group.position.y = Math.sin(elapsedTime * 2.4) * 0.2;
        return;
    }

    if (obstacle.type === 'scorpion') {
        group.position.y = Math.sin(elapsedTime * 3.2) * 0.08;
        return;
    }

    if (obstacle.type === 'sandstorm') {
        group.position.y = Math.sin(elapsedTime * 1.2) * 0.12;
        return;
    }

    group.position.y = 0;
};

const updateScorpionMarker = (marker: Group, obstacle: ObstacleConfig) => {
    const playerOffsetMeters = metersOffsetFromCoords(getPlayerRuntimeState().coords, obstacle.coords);
    const playerDistanceMeters = Math.hypot(playerOffsetMeters.x, playerOffsetMeters.z);
    const aggroDistanceMeters = Math.max(obstacle.radius ?? 0, 1) * 1.45;
    const lungeStrength =
        playerDistanceMeters > 0 && playerDistanceMeters <= aggroDistanceMeters
            ? 1 - playerDistanceMeters / aggroDistanceMeters
            : 0;
    const normalizedDirection =
        playerDistanceMeters > 0
            ? {
                  x: playerOffsetMeters.x / playerDistanceMeters,
                  z: playerOffsetMeters.z / playerDistanceMeters,
              }
            : { x: 0, z: 0 };
    const lungeOffset = {
        x: normalizedDirection.x * lungeStrength * 1.45,
        z: normalizedDirection.z * lungeStrength * 1.45,
    };

    marker.position.x += (lungeOffset.x - marker.position.x) * 0.18;
    marker.position.z += (lungeOffset.z - marker.position.z) * 0.18;

    if (playerDistanceMeters > 0) {
        marker.rotation.y = Math.atan2(normalizedDirection.x, normalizedDirection.z);
    }
};

const updateObstacleMarker = (marker: Group, obstacle: ObstacleConfig, elapsedTime: number) => {
    if (obstacle.type === 'scorpion') {
        updateScorpionMarker(marker, obstacle);
        return;
    }

    const orbitPosition = resolveObstacleOrbitPosition(obstacle, elapsedTime);
    marker.position.x = orbitPosition.x;
    marker.position.z = orbitPosition.z;
    marker.rotation.y = elapsedTime * 0.85;
};

export const ObstacleEntity = ({ obstacle }: ObstacleEntityProps) => {
    const groupRef = useRef<Group | null>(null);
    const markerRef = useRef<Group | null>(null);

    useFrame((state) => {
        if (!groupRef.current) {
            return;
        }

        const patrolOffset = resolveObstaclePatrolOffsetMeters(obstacle, getSimulationNowMs());
        groupRef.current.rotation.y = state.clock.elapsedTime * 0.18;
        groupRef.current.position.x = patrolOffset.x;
        groupRef.current.position.z = patrolOffset.z;
        updateObstacleVerticalOffset(groupRef.current, obstacle, state.clock.elapsedTime);

        if (!markerRef.current) {
            return;
        }

        updateObstacleMarker(markerRef.current, obstacle, state.clock.elapsedTime);
    });

    return (
        <group ref={groupRef} scale={OBSTACLE_VISUAL_SCALE}>
            {obstacle.type === 'flood' ? <FloodVisual obstacle={obstacle} /> : null}
            {obstacle.type === 'guard' ? <GuardVisual markerRef={markerRef} obstacle={obstacle} /> : null}
            {obstacle.type === 'rival' ? <RivalVisual markerRef={markerRef} obstacle={obstacle} /> : null}
            {obstacle.type === 'sandstorm' ? <SandstormVisual obstacle={obstacle} /> : null}
            {obstacle.type === 'scorpion' ? <ScorpionVisual markerRef={markerRef} obstacle={obstacle} /> : null}
            {obstacle.type === 'viper' ? <ViperVisual obstacle={obstacle} /> : null}
        </group>
    );
};

for (const obstacleModel of Object.values(OBSTACLE_MODELS)) {
    if (obstacleModel) {
        preloadGLTFSceneModel(obstacleModel.modelPath);
    }
}
