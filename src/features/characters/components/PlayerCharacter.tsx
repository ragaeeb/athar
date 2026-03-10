import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { FrontSide, type Material, Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CHARACTER_CONFIGS, PLAYER_MODEL_PATH } from '@/content/characters/characters';
import {
    filterValidAnimationClips,
    resolveActiveCharacterAnimationName,
    resolveCharacterAnimationNames,
    syncCharacterAnimationState,
} from '@/features/characters/components/player-animation-utils';
import { atharDebugLog } from '@/features/debug/debug';
import { getPlayerRuntimeState } from '@/features/gameplay/runtime/player-runtime';
import { useGameStore } from '@/features/gameplay/state/game.store';
import { FEATURE_FLAGS, PLAYER_VISUAL_SCALE } from '@/shared/constants/gameplay';
import { registerGLTFSceneModelSource } from '@/shared/three/gltf-loader-extensions';
import { disposeSceneModelInstance } from '@/shared/three/gltf-scene-model-utils';

type CharacterModelProps = {
    modelPath: string;
};

const normalizeStandardMaterial = (material: MeshStandardMaterial) => {
    if (material.map) {
        material.map.colorSpace = SRGBColorSpace;
    }

    material.transparent = false;
    material.opacity = 1;
    material.alphaTest = 0;
    material.depthWrite = true;
    material.side = FrontSide;
    material.envMapIntensity = 0.8;
    material.roughness = Math.min(material.roughness, 0.95);
    material.metalness = Math.min(material.metalness, 0.12);
    material.needsUpdate = true;
};

const cloneCharacterMaterial = (material: Material, materialCache: Map<Material, Material>) => {
    const cachedMaterial = materialCache.get(material);
    if (cachedMaterial) {
        return cachedMaterial;
    }

    const clonedMaterial = material.clone();
    if (clonedMaterial instanceof MeshStandardMaterial) {
        normalizeStandardMaterial(clonedMaterial);
    }

    materialCache.set(material, clonedMaterial);
    return clonedMaterial;
};

const prepareCharacterSceneNode = (child: unknown, materialCache: Map<Material, Material>) => {
    if (typeof child === 'object' && child !== null && 'frustumCulled' in child) {
        child.frustumCulled = false;
    }

    if (!(child instanceof Mesh)) {
        return;
    }

    child.castShadow = false;
    child.receiveShadow = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    child.material = Array.isArray(child.material)
        ? materials.map((material) => cloneCharacterMaterial(material, materialCache))
        : cloneCharacterMaterial(materials[0], materialCache);
};

const CharacterModel = ({ modelPath }: CharacterModelProps) => {
    const gltf = useGLTF(modelPath);
    const validAnimations = filterValidAnimationClips(gltf.animations);
    const scene = clone(gltf.scene);
    const materialCache = new Map<Material, Material>();
    scene.traverse((child) => prepareCharacterSceneNode(child, materialCache));
    const { actions } = useAnimations(validAnimations, scene);
    const { animationNames, idleAnimation, locomotionAnimation } = resolveCharacterAnimationNames(validAnimations);
    const activeAnimationNameRef = useRef<string | null>(null);
    const lastLoggedSpeedRef = useRef<number | null>(null);

    useEffect(() => {
        registerGLTFSceneModelSource(modelPath, gltf.scene);
    }, [gltf.scene, modelPath]);

    useEffect(() => {
        atharDebugLog('player', 'model-loaded', {
            animations: validAnimations.map((clip) => ({
                duration: clip.duration,
                name: clip.name,
                tracks: clip.tracks.length,
            })),
            modelPath,
        });
    }, [modelPath, validAnimations]);

    useEffect(() => {
        activeAnimationNameRef.current = null;

        return () => {
            for (const action of Object.values(actions)) {
                action?.stop();
            }

            disposeSceneModelInstance(scene);
        };
    }, [actions, scene]);

    useFrame(() => {
        const speed = getPlayerRuntimeState().speed;
        const nextAnimationName = resolveActiveCharacterAnimationName({
            idleAnimation,
            locomotionAnimation,
            speed,
        });
        const previousAnimationName = activeAnimationNameRef.current;

        if (nextAnimationName !== previousAnimationName || speed !== lastLoggedSpeedRef.current) {
            atharDebugLog(
                'player',
                'animation-selection',
                {
                    actionNames: Object.keys(actions),
                    activeAnimationName: nextAnimationName,
                    animationNames,
                    idleAnimation,
                    locomotionAnimation,
                    speed,
                },
                { throttleMs: 120 },
            );
        }

        const activeAnimationName = syncCharacterAnimationState({
            actions,
            nextAnimationName,
            previousAnimationName,
        });

        if (activeAnimationName !== previousAnimationName || speed !== lastLoggedSpeedRef.current) {
            atharDebugLog(
                'player',
                'animation-state',
                {
                    activeAnimationName,
                    speed,
                },
                { throttleMs: 120 },
            );
        }

        activeAnimationNameRef.current = activeAnimationName;
        lastLoggedSpeedRef.current = speed;
    });

    return <primitive object={scene} scale={1.55} position={[0, -1.3, 0]} rotation={[0, 0, 0]} />;
};

export const PlayerCharacter = () => {
    const selectedCharacter = useGameStore((state) => state.selectedCharacter);
    const config = CHARACTER_CONFIGS[selectedCharacter];

    useEffect(() => {
        atharDebugLog('player', 'mounted', {
            modelPath: config.modelPath,
            selectedCharacter,
        });

        return () => {
            atharDebugLog('player', 'unmounted', { selectedCharacter });
        };
    }, [config.modelPath, selectedCharacter]);

    return (
        <group scale={PLAYER_VISUAL_SCALE}>
            {FEATURE_FLAGS.useCharacterGlb && config.modelPath ? (
                <>
                    <hemisphereLight intensity={2.8} groundColor="#9a8c74" color="#ffffff" />
                    <pointLight color="#fff5dc" intensity={36} distance={18} position={[0, 3.2, 2.1]} />
                    <CharacterModel modelPath={config.modelPath} />
                </>
            ) : (
                <>
                    <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
                        <capsuleGeometry args={[0.45, 1.6, 8, 16]} />
                        <meshStandardMaterial color={config.robeColor} roughness={0.45} metalness={0.05} />
                    </mesh>
                    <mesh castShadow position={[0, 2.5, 0]}>
                        <sphereGeometry args={[0.38, 18, 18]} />
                        <meshStandardMaterial color="#f0d7be" />
                    </mesh>
                    <mesh castShadow position={[0.35, 1.8, 0.15]} rotation={[0.2, 0.1, -0.5]}>
                        <boxGeometry args={[0.18, 0.9, 0.32]} />
                        <meshStandardMaterial
                            color={config.accentColor}
                            emissive={config.accentColor}
                            emissiveIntensity={0.35}
                        />
                    </mesh>
                    <pointLight color={config.accentColor} intensity={18} distance={24} />
                </>
            )}
        </group>
    );
};

useGLTF.preload(PLAYER_MODEL_PATH);
