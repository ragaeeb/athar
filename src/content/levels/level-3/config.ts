import type { LevelConfig } from '@/content/levels/types';
import { getTeacherProfile } from '@/content/scholars/scholar-profiles';
import { MAP_STYLES } from '@/features/map/lib/map-style';

export const level3: LevelConfig = {
    ambientCue: 'ambient-city',
    completionNarration: 'Planned phase placeholder.',
    hadithTokenClusters: [],
    historicalNote: 'Future phase placeholder.',
    id: 'level-3',
    initialView: {
        bearing: 28,
        latitude: 33.3,
        longitude: 44.4,
        pitch: 60,
        zoom: 6.5,
    },
    lighting: { hour: 16, label: 'Afternoon', minute: 0 },
    mapStyle: MAP_STYLES.city,
    milestones: [
        {
            buildingType: 'madrasa',
            coords: { lat: 33.34, lng: 44.41 },
            id: 'baghdad-finale',
            label: 'Baghdad Finale',
            missionText: 'Placeholder finale milestone for the future Baghdad chapter.',
        },
    ],
    name: 'Level 3',
    namedAreas: [],
    narrative: 'Future phase: urban Baghdad play with scholars, guards, and 3D building extrusion.',
    obstacles: [],
    order: 3,
    origin: { lat: 33.3, lng: 44.4 },
    playable: false,
    subtitle: 'The Scholars of Iraq: Basra, Kufa, Baghdad',
    teachers: [
        { ...getTeacherProfile('ahmad-ibn-hanbal'), coords: { lat: 33.34, lng: 44.41 } },
        { ...getTeacherProfile('yahya-ibn-main'), coords: { lat: 33.35, lng: 44.39 } },
        { ...getTeacherProfile('abu-asim-al-nabil'), coords: { lat: 30.5, lng: 47.78 } },
    ],
    teaser: 'Planned next: Baghdad circuit with urban hazards and dense city rendering.',
    winCondition: {
        finalMilestone: 'baghdad-finale',
        requiredHadith: 70,
        requiredTeachers: ['ahmad-ibn-hanbal', 'yahya-ibn-main', 'abu-asim-al-nabil'],
    },
};
