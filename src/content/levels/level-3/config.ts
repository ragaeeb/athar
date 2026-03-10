import { createLevelCompletionContent } from '@/content/levels/completion-content';
import type { LevelConfig } from '@/content/levels/types';
import { getTeacherProfile } from '@/content/scholars/scholar-profiles';
import { MAP_STYLES } from '@/features/map/lib/map-style';

export const level3: LevelConfig = {
    ambientCue: 'ambient-city',
    completionContent: createLevelCompletionContent({
        eyebrow: 'Iraq Circuit Complete',
        historicalNoteTitle: 'Iraq Route Note',
        nextChapterActionLabel: 'Return East',
        nextChapterTitle: 'Next Journey: Persia and the East',
        reviewActionLabel: 'Review the Iraq Route',
    }),
    completionNarration:
        'The Iraq leg closes with Basra, Kufa, and Baghdad joined into one working chain. The player has to manage denser hazards, tighter scholar spacing, and a more urban route rhythm without losing the gathered reports needed for the eastern road.',
    hadithTokenClusters: [
        {
            center: { lat: 30.51, lng: 47.79 },
            count: 14,
            id: 'basra-ledgers',
            label: 'Basra harbor ledgers',
            radius: 18_000,
        },
        {
            center: { lat: 31.31, lng: 45.44 },
            count: 12,
            id: 'hira-crossing-notes',
            label: 'Hira crossing notes',
            radius: 20_000,
        },
        {
            center: { lat: 32.01, lng: 44.4 },
            count: 14,
            id: 'kufa-study-scrolls',
            label: 'Kufa study scrolls',
            radius: 18_000,
        },
        {
            center: { lat: 33.31, lng: 44.37 },
            count: 16,
            id: 'baghdad-review-sheets',
            label: 'Baghdad review sheets',
            radius: 16_000,
        },
    ],
    historicalNote:
        'This chapter compresses the southern Iraq circuit into Basra, Hira, Kufa, and Baghdad anchors so the route can feel denser without requiring a full city simulation. The important shift is not geographic size but scholarly intensity: more scrutiny, more interruptions, and less room for careless carrying.',
    id: 'level-3',
    initialView: {
        bearing: 19,
        latitude: 31.7,
        longitude: 45.3,
        pitch: 62,
        zoom: 7.1,
    },
    lighting: { hour: 15, label: 'Iraq afternoon light', minute: 30 },
    mapStyle: MAP_STYLES.city,
    milestones: [
        {
            buildingType: 'market',
            coords: { lat: 30.5, lng: 47.82 },
            id: 'basra-harbor',
            label: 'Basra Harbor',
            missionText:
                'Enter the Iraq circuit through Basra and collect the harbor reports without letting rivals strip the satchel early.',
        },
        {
            buildingType: 'caravanserai',
            coords: { lat: 31.31, lng: 45.43 },
            id: 'hira-crossing',
            label: 'Hira Crossing',
            missionText:
                'Push inland from the marsh channels and keep the river hazards from scattering too much of the route record.',
        },
        {
            buildingType: 'madrasa',
            coords: { lat: 32.02, lng: 44.4 },
            id: 'kufa-study-gate',
            label: 'Kufa Study Gate',
            missionText:
                'Reach the Kufan study circles and secure the critic-teacher encounters before the Baghdad approach.',
        },
        {
            buildingType: 'minaret',
            coords: { lat: 33.31, lng: 44.37 },
            id: 'baghdad-hall-of-review',
            label: 'Baghdad Hall of Review',
            missionText:
                'Arrive in Baghdad with the Iraq scholar chain complete and enough preserved hadith to justify the eastern leg.',
        },
    ],
    name: 'Level 3',
    namedAreas: [
        { coords: { lat: 30.5, lng: 47.82 }, id: 'basra', label: 'Basra' },
        { coords: { lat: 31.31, lng: 45.43 }, id: 'hira', label: 'Hira' },
        { coords: { lat: 32.02, lng: 44.4 }, id: 'kufa', label: 'Kufa' },
        { coords: { lat: 33.31, lng: 44.37 }, id: 'baghdad', label: 'Baghdad' },
    ],
    narrative:
        'The Iraq chapter condenses the Basra-Kufa-Baghdad circuit into a denser scholarly route. Compared with the Hijaz leg, it asks the player to bank hadith more deliberately because rivals, floods, and guards can all interrupt the road before the Baghdad review point.',
    obstacles: [
        {
            coords: { lat: 30.92, lng: 46.84 },
            id: 'basra-rival-corridor',
            label: 'Rival Collector',
            patrolRadius: 24_000,
            radius: 46_000,
            type: 'rival',
        },
        {
            coords: { lat: 31.58, lng: 45.16 },
            id: 'euphrates-floodplain',
            label: 'Flooded Crossing',
            radius: 56_000,
            type: 'flood',
        },
        {
            coords: { lat: 32.74, lng: 44.23 },
            id: 'baghdad-guard-line',
            label: 'Guard Patrol',
            patrolRadius: 18_000,
            radius: 42_000,
            type: 'guard',
        },
    ],
    order: 3,
    origin: { lat: 30.5, lng: 47.82 },
    playable: true,
    subtitle: 'The Scholars of Iraq: Basra, Kufa, Baghdad',
    teachers: [
        {
            ...getTeacherProfile('abu-asim-al-nabil'),
            city: 'Basra',
            coords: { lat: 30.51, lng: 47.8 },
        },
        {
            ...getTeacherProfile('yahya-ibn-main'),
            city: 'Kufa',
            coords: { lat: 32.01, lng: 44.39 },
        },
        {
            ...getTeacherProfile('ahmad-ibn-hanbal'),
            city: 'Baghdad',
            coords: { lat: 33.31, lng: 44.37 },
        },
    ],
    teaser: 'Playable Iraq chapter with denser city-route pacing, three scholar encounters, and pressure from rivals, floods, and guards.',
    winCondition: {
        finalMilestone: 'baghdad-hall-of-review',
        requiredHadith: 48,
        requiredTeachers: ['abu-asim-al-nabil', 'yahya-ibn-main', 'ahmad-ibn-hanbal'],
    },
};
