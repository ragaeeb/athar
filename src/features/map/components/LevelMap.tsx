import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Coordinates, coordsToVector3, NearCoordinates } from 'react-three-map/maplibre';
import type { Group } from 'three';
import type { LevelConfig } from '@/content/levels/types';
import { PlayerCharacter } from '@/features/characters/components/PlayerCharacter';
import { TeacherNPC } from '@/features/characters/components/TeacherNPC';
import { atharDebugLog } from '@/features/debug/debug';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { Milestone3DBuilding } from '@/features/milestones/components/Milestone3DBuilding';
import { ObstacleEntity } from '@/features/obstacles/components/ObstacleEntity';
import { HadithToken } from '@/features/tokens/components/HadithToken';
import { MAP_LABEL_FONT_SIZE } from '@/shared/constants/gameplay';

type LevelMapProps = {
    level: LevelConfig;
};

type PlayerMarkerProps = {
    originLat: number;
    originLng: number;
};

const PlayerMarker = ({ originLat, originLng }: PlayerMarkerProps) => {
    const groupRef = useRef<Group>(null);

    useEffect(() => {
        atharDebugLog('player-marker', 'mounted');
        return () => {
            atharDebugLog('player-marker', 'unmounted');
        };
    }, []);

    useFrame(() => {
        if (!groupRef.current) {
            return;
        }

        const coords = usePlayerStore.getState().coords;
        const [x, y, z] = coordsToVector3(
            { latitude: coords.lat, longitude: coords.lng },
            { latitude: originLat, longitude: originLng },
        );
        groupRef.current.position.set(x, y, z);
    });

    return (
        <group ref={groupRef}>
            <PlayerCharacter />
        </group>
    );
};

export const LevelMap = ({ level }: LevelMapProps) => {
    const tokens = useLevelStore((state) => state.tokens);

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

            {tokens
                .filter((token) => !token.collected)
                .map((token) =>
                    token.kind === 'cluster' ? (
                        <NearCoordinates key={token.id} latitude={token.anchor.lat} longitude={token.anchor.lng}>
                            <group position={[token.localOffsetMeters.x, 0, token.localOffsetMeters.z]}>
                                <HadithToken token={token} />
                            </group>
                        </NearCoordinates>
                    ) : (
                        <Coordinates key={token.id} latitude={token.coords.lat} longitude={token.coords.lng}>
                            <HadithToken token={token} />
                        </Coordinates>
                    ),
                )}

            <Coordinates latitude={level.origin.lat} longitude={level.origin.lng}>
                <PlayerMarker originLat={level.origin.lat} originLng={level.origin.lng} />
            </Coordinates>
        </>
    );
};
