import type { LevelConfig } from '@/content/levels/types';
import { getTeacherProfile } from '@/content/scholars/scholar-profiles';
import { MAP_STYLES } from '@/features/map/lib/map-style';

export const level1: LevelConfig = {
    ambientCue: 'ambient-desert',
    completionNarration:
        'The first Athar chapter closes as the scholar reaches Makkah with preserved reports and one trusted teacher added to his chain.',
    hadithTokenClusters: [
        {
            center: { lat: 39.77, lng: 64.43 },
            count: 12,
            id: 'bukhara-cluster',
            label: 'Bukhara notebooks',
            radius: 38_000,
        },
        {
            center: { lat: 37.6, lng: 61.83 },
            count: 10,
            id: 'merv-cluster',
            label: 'Merv caravan camp',
            radius: 30_000,
        },
        {
            center: { lat: 36.76, lng: 66.9 },
            count: 12,
            id: 'balkh-cluster',
            label: 'Balkh study circles',
            radius: 32_000,
        },
        {
            center: { lat: 35.6, lng: 51.44 },
            count: 12,
            id: 'ray-cluster',
            label: 'Ray manuscript market',
            radius: 36_000,
        },
    ],
    historicalNote:
        'This build uses a compressed route abstraction for playability, but the level anchors its milestones to the real cities named in the prompt.',
    id: 'level-1',
    initialView: {
        bearing: 28,
        latitude: 39.77,
        longitude: 64.43,
        pitch: 62,
        zoom: 7.4,
    },
    lighting: {
        hour: 14,
        label: 'High day caravan light',
        minute: 0,
    },
    mapStyle: MAP_STYLES.desert,
    milestones: [
        {
            buildingType: 'market',
            coords: { lat: 39.77, lng: 64.43 },
            id: 'bukhara-market',
            label: 'Bukhara Market',
            missionText: 'Begin the caravan route and gather the first scattered narrations.',
        },
        {
            buildingType: 'caravanserai',
            coords: { lat: 37.6, lng: 61.83 },
            id: 'merv-crossing',
            label: 'Merv Crossing',
            missionText: 'Follow the Khurasan road and keep your token satchel intact.',
        },
        {
            buildingType: 'madrasa',
            coords: { lat: 36.21, lng: 58.79 },
            id: 'nishapur-library',
            label: 'Nishapur Study Circle',
            missionText: 'Push toward the scholars of Nishapur and avoid the storm belt.',
        },
        {
            buildingType: 'minaret',
            coords: { lat: 35.6, lng: 51.44 },
            id: 'ray-gate',
            label: 'Ray Gate',
            missionText: 'Cross into western Persia and prepare for the holy cities beyond.',
        },
        {
            buildingType: 'mosque',
            coords: { lat: 21.42, lng: 39.83 },
            id: 'makkah-sanctuary',
            label: 'Makkah Sanctuary',
            missionText: 'Reach Makkah with enough preserved hadith to complete the first chapter.',
        },
    ],
    name: 'Level 1',
    namedAreas: [
        { coords: { lat: 39.77, lng: 64.43 }, id: 'bukhara', label: 'Bukhara' },
        { coords: { lat: 37.6, lng: 61.83 }, id: 'merv', label: 'Merv' },
        { coords: { lat: 36.21, lng: 58.79 }, id: 'nishapur', label: 'Nishapur' },
        { coords: { lat: 35.6, lng: 51.44 }, id: 'ray', label: 'Ray' },
        { coords: { lat: 21.42, lng: 39.83 }, id: 'makkah', label: 'Makkah' },
    ],
    narrative:
        'Young al-Bukhari leaves Bukhara and pushes south and west through Khurasan on the road to the holy sanctuary. The route is compressed into a high-speed caravan map so the level stays playable while preserving the real city anchors.',
    obstacles: [
        {
            coords: { lat: 37.6, lng: 61.83 },
            id: 'viper-khurasan-pass',
            label: 'Desert Viper',
            patrolRadius: 30_000,
            radius: 60_000,
            type: 'viper',
        },
        {
            coords: { lat: 34.9, lng: 53.8 },
            id: 'sandstorm-ray-corridor',
            label: 'Sandstorm Wall',
            radius: 120_000,
            type: 'sandstorm',
        },
    ],
    order: 1,
    origin: { lat: 39.77, lng: 64.43 },
    playable: true,
    subtitle: 'The First Steps: Bukhara to Makkah',
    teachers: [
        {
            ...getTeacherProfile('makki-ibn-ibrahim'),
            coords: { lat: 36.76, lng: 66.9 },
        },
    ],
    teaser: 'Playable vertical slice',
    winCondition: {
        finalMilestone: 'makkah-sanctuary',
        requiredHadith: 30,
        requiredTeachers: ['makki-ibn-ibrahim'],
    },
};
