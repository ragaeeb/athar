import { createLevelCompletionContent } from '@/content/levels/completion-content';
import type { LevelConfig } from '@/content/levels/types';
import { getTeacherProfile } from '@/content/scholars/scholar-profiles';
import { MAP_STYLES } from '@/features/map/lib/map-style';

export const level4: LevelConfig = {
    ambientCue: 'ambient-desert',
    completionContent: createLevelCompletionContent({
        eyebrow: 'Eastern Route Complete',
        historicalNoteTitle: 'Eastern Route Note',
        nextChapterActionLabel: 'Begin the Finale',
        nextChapterTitle: 'Next Journey: The Final Compilation',
        reviewActionLabel: 'Review the Eastern Route',
    }),
    completionNarration:
        'The eastern route ends after Ray, Nishapur, and Merv have been held together through harsher environmental pressure. The chapter is shorter in scholar count than Iraq but less forgiving: desert spacing, survival hazards, and a slower rhythm of safe recovery points.',
    hadithTokenClusters: [
        {
            center: { lat: 35.69, lng: 51.42 },
            count: 14,
            id: 'ray-market-notes',
            label: 'Ray market notes',
            radius: 18_000,
        },
        {
            center: { lat: 35.28, lng: 55.02 },
            count: 12,
            id: 'sabzevar-well-scrolls',
            label: 'Wellside scrolls',
            radius: 24_000,
        },
        {
            center: { lat: 36.21, lng: 58.79 },
            count: 14,
            id: 'nishapur-revision-circles',
            label: 'Nishapur revision circles',
            radius: 20_000,
        },
        {
            center: { lat: 37.6, lng: 61.83 },
            count: 16,
            id: 'merv-caravan-ledgers',
            label: 'Merv caravan ledgers',
            radius: 18_000,
        },
    ],
    historicalNote:
        'The eastern return route compresses long desert intervals into Ray, the Sabzevar wells, Nishapur, and Merv. The chapter is authored to feel more exposed than Iraq, with wider gaps between safe anchors and more punishment for carrying everything through a hazard belt.',
    id: 'level-4',
    initialView: {
        bearing: 18,
        latitude: 36.0,
        longitude: 56.8,
        pitch: 60,
        zoom: 6.4,
    },
    lighting: { hour: 18, label: 'Eastern dusk light', minute: 15 },
    mapStyle: MAP_STYLES.desert,
    milestones: [
        {
            buildingType: 'minaret',
            coords: { lat: 35.69, lng: 51.42 },
            id: 'ray-gate',
            label: 'Ray Gate',
            missionText:
                'Leave western Persia and cross back into the eastern road before the first hazard belt closes around the player.',
        },
        {
            buildingType: 'caravanserai',
            coords: { lat: 35.28, lng: 55.02 },
            id: 'sabzevar-wells',
            label: 'Sabzevar Wells',
            missionText:
                'Reach the wells, recover the scattered notes you can, and do not let the desert route drain the satchel too early.',
        },
        {
            buildingType: 'madrasa',
            coords: { lat: 36.21, lng: 58.79 },
            id: 'nishapur-review-house',
            label: 'Nishapur Review House',
            missionText:
                'Meet the eastern teacher and leave Nishapur with enough preserved reports to survive the last exposed stretch.',
        },
        {
            buildingType: 'caravanserai',
            coords: { lat: 37.6, lng: 61.83 },
            id: 'merv-finale',
            label: 'Merv Caravan Review',
            missionText:
                'Reach Merv with the eastern chain complete and enough gathered hadith to justify the final compilation leg.',
        },
    ],
    name: 'Level 4',
    namedAreas: [
        { coords: { lat: 35.69, lng: 51.42 }, id: 'ray', label: 'Ray' },
        { coords: { lat: 35.28, lng: 55.02 }, id: 'sabzevar', label: 'Sabzevar' },
        { coords: { lat: 36.21, lng: 58.79 }, id: 'nishapur', label: 'Nishapur' },
        { coords: { lat: 37.6, lng: 61.83 }, id: 'merv', label: 'Merv' },
    ],
    narrative:
        'The eastern chapter turns the route back across Persia toward Merv. It is a survival-oriented leg: fewer scholar meetings, longer exposed crossings, and hazard pacing that tests whether the player learned to bank, recover, and keep moving under dusk light.',
    obstacles: [
        {
            coords: { lat: 35.92, lng: 52.61 },
            id: 'ray-viper-pass',
            label: 'Viper Pass',
            patrolRadius: 20_000,
            radius: 44_000,
            type: 'viper',
        },
        {
            coords: { lat: 35.74, lng: 56.98 },
            id: 'sabzevar-sand-wall',
            label: 'Sandstorm Wall',
            radius: 110_000,
            type: 'sandstorm',
        },
        {
            coords: { lat: 36.94, lng: 60.52 },
            id: 'merv-guard-cordon',
            label: 'Guard Cordon',
            patrolRadius: 16_000,
            radius: 42_000,
            type: 'guard',
        },
        {
            coords: { lat: 36.38, lng: 59.66 },
            id: 'nishapur-flood-wash',
            label: 'Flash Flood',
            radius: 54_000,
            type: 'flood',
        },
    ],
    order: 4,
    origin: { lat: 35.69, lng: 51.42 },
    playable: true,
    subtitle: 'Persia and the East: Ray, Nishapur, Merv',
    teachers: [
        {
            ...getTeacherProfile('ishaq-ibn-rahwayh'),
            city: 'Nishapur',
            coords: { lat: 36.21, lng: 58.79 },
        },
    ],
    teaser: 'Playable eastern chapter with dusk lighting, survival-oriented hazards, and the final push back toward Merv.',
    winCondition: {
        finalMilestone: 'merv-finale',
        requiredHadith: 52,
        requiredTeachers: ['ishaq-ibn-rahwayh'],
    },
};
