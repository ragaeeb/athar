import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { FrontSide, LoopRepeat, Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useGameStore } from '@/game/store/game.store';
import { usePlayerStore } from '@/game/store/player.store';
import { CHARACTER_CONFIGS, FEATURE_FLAGS, PLAYER_MODEL_PATH, PLAYER_VISUAL_SCALE } from '@/lib/constants';
import { atharDebugLog } from '@/lib/debug';

type CharacterModelProps = {
    modelPath: string;
    speed: number;
};

const animationNameMatches = (name: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(name));

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

const prepareCharacterSceneNode = (child: unknown) => {
    if (typeof child === 'object' && child !== null && 'frustumCulled' in child) {
        child.frustumCulled = false;
    }

    if (!(child instanceof Mesh)) {
        return;
    }

    child.castShadow = false;
    child.receiveShadow = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
        if (material instanceof MeshStandardMaterial) {
            normalizeStandardMaterial(material);
        }
    }
};

const CharacterModel = ({ modelPath, speed }: CharacterModelProps) => {
    const gltf = useGLTF(modelPath);
    const validAnimations = useMemo(
        () => gltf.animations.filter((clip) => clip.duration > 0.05 && clip.tracks.length > 0),
        [gltf.animations],
    );
    const scene = useMemo(() => {
        const clonedScene = clone(gltf.scene);
        clonedScene.traverse(prepareCharacterSceneNode);

        return clonedScene;
    }, [gltf.scene]);
    const { actions } = useAnimations(validAnimations, scene);
    const animationNames = useMemo(() => validAnimations.map((clip) => clip.name), [validAnimations]);
    const fallbackAnimation = animationNames[0] ?? null;
    const locomotionAnimation = useMemo(
        () =>
            animationNames.find((name) =>
                animationNameMatches(name, [/walk/i, /run/i, /jog/i, /locomot/i, /mixamo/i]),
            ) ?? fallbackAnimation,
        [animationNames, fallbackAnimation],
    );
    const idleAnimation = useMemo(
        () => animationNames.find((name) => animationNameMatches(name, [/idle/i, /stand/i])) ?? null,
        [animationNames],
    );

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
        for (const action of Object.values(actions)) {
            action?.stop();
        }

        const activeAnimationName = speed > 0 ? locomotionAnimation : idleAnimation;
        atharDebugLog(
            'player',
            'animation-selection',
            {
                actionNames: Object.keys(actions),
                activeAnimationName,
                idleAnimation,
                locomotionAnimation,
                speed,
            },
            { throttleMs: 120 },
        );

        if (!activeAnimationName) {
            return;
        }

        const activeAction = actions[activeAnimationName];
        if (!activeAction) {
            return;
        }

        activeAction.reset();
        activeAction.setLoop(LoopRepeat, Infinity);
        activeAction.setEffectiveTimeScale(1);
        activeAction.fadeIn(0.2).play();
        return () => {
            activeAction.fadeOut(0.2);
        };
    }, [actions, idleAnimation, locomotionAnimation, speed]);

    return <primitive object={scene} scale={1.55} position={[0, -1.3, 0]} rotation={[0, 0, 0]} />;
};

export const PlayerCharacter = () => {
    const selectedCharacter = useGameStore((state) => state.selectedCharacter);
    const bearing = usePlayerStore((state) => state.bearing);
    const speed = usePlayerStore((state) => state.speed);
    const config = CHARACTER_CONFIGS[selectedCharacter];
    const visualBearing = Math.PI - bearing;

    useEffect(() => {
        atharDebugLog('player', 'mounted', {
            modelPath: config.modelPath,
            selectedCharacter,
        });

        return () => {
            atharDebugLog('player', 'unmounted', { selectedCharacter });
        };
    }, [config.modelPath, selectedCharacter]);

    useEffect(() => {
        atharDebugLog(
            'player',
            'pose-update',
            {
                bearing,
                selectedCharacter,
                speed,
                visualBearing,
            },
            { throttleMs: 120 },
        );
    }, [bearing, selectedCharacter, speed, visualBearing]);

    return (
        <group rotation={[0, visualBearing, 0]} scale={PLAYER_VISUAL_SCALE}>
            {FEATURE_FLAGS.useCharacterGlb && config.modelPath ? (
                <>
                    <hemisphereLight intensity={2.8} groundColor="#9a8c74" color="#ffffff" />
                    <pointLight color="#fff5dc" intensity={36} distance={18} position={[0, 3.2, 2.1]} />
                    <CharacterModel modelPath={config.modelPath} speed={speed} />
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
