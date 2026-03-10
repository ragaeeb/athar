import type { ObstacleConfig } from '@/content/levels/types';

export type ObstacleVisualDescriptor = {
    accentColor: string;
    bodyColor: string;
    emissiveColor: string;
    orbitRadius: number;
    orbitSpeed: number;
    profile: 'flood' | 'guard' | 'rival' | 'sandstorm' | 'scorpion' | 'viper';
};

export const getObstacleVisualDescriptor = (obstacle: ObstacleConfig): ObstacleVisualDescriptor => {
    switch (obstacle.type) {
        case 'flood':
            return {
                accentColor: '#90caf9',
                bodyColor: '#2f6f93',
                emissiveColor: '#4cc9f0',
                orbitRadius: 0.7,
                orbitSpeed: 0.75,
                profile: 'flood',
            };
        case 'guard':
            return {
                accentColor: '#f8d66d',
                bodyColor: '#6b2a22',
                emissiveColor: '#ff9f1c',
                orbitRadius: 1.2,
                orbitSpeed: 0.55,
                profile: 'guard',
            };
        case 'rival':
            return {
                accentColor: '#f4d35e',
                bodyColor: '#7b2236',
                emissiveColor: '#ef476f',
                orbitRadius: 1.05,
                orbitSpeed: 0.9,
                profile: 'rival',
            };
        case 'sandstorm':
            return {
                accentColor: '#e9c46a',
                bodyColor: '#cda15d',
                emissiveColor: '#dda15e',
                orbitRadius: 0.8,
                orbitSpeed: 0.4,
                profile: 'sandstorm',
            };
        case 'scorpion':
            return {
                accentColor: '#ffd166',
                bodyColor: '#6c3a1f',
                emissiveColor: '#ff7b00',
                orbitRadius: 0.7,
                orbitSpeed: 1.1,
                profile: 'scorpion',
            };
        case 'viper':
            return {
                accentColor: '#f8f0dc',
                bodyColor: '#8b1e3f',
                emissiveColor: '#d62839',
                orbitRadius: 0.9,
                orbitSpeed: 0.8,
                profile: 'viper',
            };
    }
};

export const resolveObstacleOrbitPosition = (obstacle: ObstacleConfig, elapsedTime: number) => {
    if (!obstacle.patrolRadius) {
        return { x: 0, z: 0 };
    }

    const descriptor = getObstacleVisualDescriptor(obstacle);
    const orbitRadius = descriptor.orbitRadius + Math.min(obstacle.patrolRadius / 40_000, 0.9);
    const orbitAngle = elapsedTime * descriptor.orbitSpeed + obstacle.id.length * 0.17;

    return {
        x: Math.cos(orbitAngle) * orbitRadius,
        z: Math.sin(orbitAngle) * orbitRadius,
    };
};
