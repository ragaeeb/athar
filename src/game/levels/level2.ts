import { MAP_STYLES } from '@/lib/constants';
import { getTeacherProfile } from '@/lib/hadith-data';

import type { LevelConfig } from './level.types';

export const level2: LevelConfig = {
    ambientCue: 'ambient-city',
    completionNarration: 'Planned phase placeholder.',
    hadithTokenClusters: [],
    historicalNote: 'Future phase placeholder.',
    id: 'level-2',
    initialView: {
        bearing: 20,
        latitude: 23.3,
        longitude: 39.7,
        pitch: 60,
        zoom: 6.2,
    },
    lighting: { hour: 10, label: 'Morning', minute: 0 },
    mapStyle: MAP_STYLES.city,
    milestones: [
        {
            buildingType: 'mosque',
            coords: { lat: 24.47, lng: 39.61 },
            id: 'madinah-finale',
            label: 'Madinah Finale',
            missionText: 'Placeholder finale milestone for the future Hijaz chapter.',
        },
    ],
    name: 'Level 2',
    namedAreas: [],
    narrative:
        'Future phase: a dense Hijaz map focused on the holy cities, rival collectors, and multiple teacher encounters.',
    obstacles: [],
    order: 2,
    origin: { lat: 23.3, lng: 39.7 },
    playable: false,
    subtitle: 'The Arabian Heartland: Makkah & Madinah',
    teachers: [
        { ...getTeacherProfile('ali-ibn-al-madini'), coords: { lat: 24.47, lng: 39.61 } },
        { ...getTeacherProfile('abdullah-ibn-yusuf'), coords: { lat: 24.46, lng: 39.62 } },
        { ...getTeacherProfile('ibn-abi-uways'), coords: { lat: 21.43, lng: 39.84 } },
    ],
    teaser: 'Planned next: Hijaz scholar circuit with three teachers and rival collectors.',
    winCondition: {
        finalMilestone: 'madinah-finale',
        requiredHadith: 50,
        requiredTeachers: ['ali-ibn-al-madini', 'abdullah-ibn-yusuf', 'ibn-abi-uways'],
    },
};
