import { a, useSpring } from '@react-spring/three';
import { useMemo } from 'react';
import { useLevelStore } from '@/game/store/level.store';
import { usePlayerStore } from '@/game/store/player.store';
import { NAVIGATION_ARROW_VISUAL_SCALE, OBJECTIVE_GOLD_RADIUS_METERS } from '@/lib/constants';
import { worldDistanceInMeters } from '@/lib/geo';

export const NavigationArrow = () => {
    const objective = useLevelStore((state) => state.nextObjective);
    const playerCoords = usePlayerStore((state) => state.coords);

    const target = useMemo(() => {
        if (!objective) {
            return {
                close: false,
                rotation: 0,
            };
        }

        const deltaLng = objective.coords.lng - playerCoords.lng;
        const deltaLat = objective.coords.lat - playerCoords.lat;
        const distance = worldDistanceInMeters(objective.coords, playerCoords);

        return {
            close: distance <= OBJECTIVE_GOLD_RADIUS_METERS,
            rotation: Math.atan2(deltaLng, deltaLat),
        };
    }, [objective, playerCoords]);

    const spring = useSpring({
        config: {
            friction: 18,
            tension: 180,
        },
        loop: target.close ? { reverse: true } : false,
        scale: target.close ? 1.25 : 1,
    });

    if (!objective) {
        return null;
    }

    return (
        <a.group
            position={[0, 6_500, 0]}
            rotation={[0, target.rotation, 0]}
            scale={spring.scale.to((value) => value * NAVIGATION_ARROW_VISUAL_SCALE)}
        >
            <mesh castShadow rotation={[Math.PI / 2, 0, Math.PI]}>
                <coneGeometry args={[0.42, 1.1, 3]} />
                <meshStandardMaterial
                    color={target.close ? '#e9c46a' : '#5ad4c9'}
                    emissive={target.close ? '#e9c46a' : '#2fb8ad'}
                    emissiveIntensity={1}
                />
            </mesh>
            <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.72, 0.08, 12, 48]} />
                <meshStandardMaterial color="#f8f0dc" emissive="#f8f0dc" emissiveIntensity={0.35} />
            </mesh>
        </a.group>
    );
};
