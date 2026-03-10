import { Billboard, Text } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { Coordinates, NearCoordinates } from 'react-three-map/maplibre';
import type { Group } from 'three';
import type { LevelConfig } from '@/content/levels/types';
import { PlayerCharacter } from '@/features/characters/components/PlayerCharacter';
import { TeacherNPC } from '@/features/characters/components/TeacherNPC';
import { atharDebugLog } from '@/features/debug/debug';
import { sceneRegistry } from '@/features/gameplay/presentation/SceneRegistry';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { Milestone3DBuilding } from '@/features/milestones/components/Milestone3DBuilding';
import { ObstacleEntity } from '@/features/obstacles/components/ObstacleEntity';
import { HadithToken } from '@/features/tokens/components/HadithToken';
import { HadithTokenClusterInstances } from '@/features/tokens/components/HadithTokenClusterInstances';
import { buildTokenRenderGroups } from '@/features/tokens/lib/token-render-groups';
import { MAP_LABEL_FONT_SIZE } from '@/shared/constants/gameplay';

type LevelMapProps = {
    level: LevelConfig;
};

const PlayerMarker = () => {
    const groupRef = useRef<Group>(null);

    useEffect(() => {
        const group = groupRef.current;
        if (!group) {
            return;
        }

        sceneRegistry.registerEntity('player', group);
        atharDebugLog('player-marker', 'mounted');

        return () => {
            sceneRegistry.unregisterEntity('player', group);
            atharDebugLog('player-marker', 'unmounted');
        };
    }, []);

    return (
        <group ref={groupRef}>
            <PlayerCharacter />
        </group>
    );
};

export const LevelMap = ({ level }: LevelMapProps) => {
    const tokens = useLevelStore((state) => state.tokens);
    const { clusterGroups, scatteredTokens } = buildTokenRenderGroups(tokens);

    return (
        <>
            {level.namedAreas.map((area) => (
                <Coordinates key={area.id} latitude={area.coords.lat} longitude={area.coords.lng}>
                    <Billboard position={[0, 16_000, 0]}>
                        <Text
                            fontSize={MAP_LABEL_FONT_SIZE}
                            color="#f8f0dc"
                            outlineColor="#071118"
                            outlineWidth={800}
                            anchorX="center"
                        >
                            {area.label}
                        </Text>
                    </Billboard>
                </Coordinates>
            ))}

            {level.milestones.map((milestone) => (
                <Coordinates key={milestone.id} latitude={milestone.coords.lat} longitude={milestone.coords.lng}>
                    <Milestone3DBuilding milestone={milestone} />
                </Coordinates>
            ))}

            {level.teachers.map((teacher) => (
                <Coordinates key={teacher.id} latitude={teacher.coords.lat} longitude={teacher.coords.lng}>
                    <TeacherNPC teacher={teacher} />
                </Coordinates>
            ))}

            {level.obstacles.map((obstacle) => (
                <Coordinates key={obstacle.id} latitude={obstacle.coords.lat} longitude={obstacle.coords.lng}>
                    <ObstacleEntity obstacle={obstacle} />
                </Coordinates>
            ))}

            {clusterGroups.map((group) => (
                <NearCoordinates key={group.id} latitude={group.anchor.lat} longitude={group.anchor.lng}>
                    <HadithTokenClusterInstances tokens={group.tokens} />
                </NearCoordinates>
            ))}

            {scatteredTokens.map((token) => (
                <Coordinates key={token.id} latitude={token.coords.lat} longitude={token.coords.lng}>
                    <HadithToken token={token} />
                </Coordinates>
            ))}

            <Coordinates latitude={level.origin.lat} longitude={level.origin.lng}>
                <PlayerMarker />
            </Coordinates>
        </>
    );
};
