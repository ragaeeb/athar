import { createLevelCompletionContent } from '@/content/levels/completion-content';
import type { LevelConfig } from '@/content/levels/types';
import { getTeacherProfile } from '@/content/scholars/scholar-profiles';
import { MAP_STYLES } from '@/features/map/lib/map-style';

export const level2: LevelConfig = {
    ambientCue: 'ambient-city',
    completionContent: createLevelCompletionContent({
        eyebrow: 'Hijaz Circuit Complete',
        historicalNoteTitle: 'Hijaz Route Note',
        nextChapterActionLabel: 'Enter Iraq',
        nextChapterTitle: 'Next Journey: The Scholars of Iraq',
        reviewActionLabel: 'Review the Hijaz Route',
    }),
    completionNarration:
        'The Hijaz chapter closes as the route reaches Madinah with three scholar meetings secured and enough preserved hadith to carry the journey onward to Iraq.',
    hadithTokenClusters: [
        {
            center: { lat: 21.74, lng: 39.29 },
            count: 10,
            id: 'makkah-manuscripts',
            label: 'Makkah manuscript satchels',
            radius: 16_000,
        },
        {
            center: { lat: 22.73, lng: 39.17 },
            count: 12,
            id: 'juhfa-camp',
            label: 'Juhfa caravan notes',
            radius: 18_000,
        },
        {
            center: { lat: 23.72, lng: 38.92 },
            count: 14,
            id: 'badr-memorizers',
            label: 'Badr route notebooks',
            radius: 20_000,
        },
        {
            center: { lat: 24.39, lng: 39.51 },
            count: 14,
            id: 'madinah-circles',
            label: 'Madinah study circles',
            radius: 16_000,
        },
    ],
    historicalNote:
        'This chapter compresses the western Hijaz road into a readable sequence of Makkah, Juhfa, Badr, and Madinah anchors so the route remains legible at game speed.',
    id: 'level-2',
    initialView: {
        bearing: 8,
        latitude: 22.95,
        longitude: 39.34,
        pitch: 62,
        zoom: 7.3,
    },
    lighting: { hour: 9, label: 'Hijaz morning light', minute: 30 },
    mapStyle: MAP_STYLES.city,
    milestones: [
        {
            buildingType: 'mosque',
            coords: { lat: 21.42, lng: 39.83 },
            id: 'makkah-sanctuary',
            label: 'Makkah Sanctuary',
            missionText:
                'Leave the sanctuary with a disciplined route plan and do not waste your first collected reports.',
        },
        {
            buildingType: 'caravanserai',
            coords: { lat: 22.71, lng: 39.13 },
            id: 'juhfa-wells',
            label: 'Juhfa Wells',
            missionText: 'Reach the caravan wells and keep your satchel intact through the first desert pressure.',
        },
        {
            buildingType: 'market',
            coords: { lat: 23.78, lng: 38.79 },
            id: 'badr-camp',
            label: 'Badr Caravan Camp',
            missionText: 'Pass the Badr plain, collect the route notebooks, and secure the middle scholar encounter.',
        },
        {
            buildingType: 'madrasa',
            coords: { lat: 24.33, lng: 39.55 },
            id: 'madinah-study-gate',
            label: 'Madinah Study Gate',
            missionText: 'Enter the northern learning circuit and prepare for the final critic of transmitters.',
        },
        {
            buildingType: 'mosque',
            coords: { lat: 24.47, lng: 39.61 },
            id: 'prophets-mosque',
            label: "Prophet's Mosque",
            missionText:
                'Arrive in Madinah with the full scholar chain and enough gathered hadith to close the chapter.',
        },
    ],
    name: 'Level 2',
    namedAreas: [
        { coords: { lat: 21.42, lng: 39.83 }, id: 'makkah', label: 'Makkah' },
        { coords: { lat: 22.71, lng: 39.13 }, id: 'juhfa', label: 'Juhfa' },
        { coords: { lat: 23.78, lng: 38.79 }, id: 'badr', label: 'Badr' },
        { coords: { lat: 24.47, lng: 39.61 }, id: 'madinah', label: 'Madinah' },
    ],
    narrative:
        'Al-Bukhari now travels the Hijaz corridor from Makkah toward Madinah. This chapter is tighter and denser than the first route: three scholar encounters, short high-value caravan stops, and hazards that pressure the player to bank hadith repeatedly rather than carrying everything into the final leg.',
    obstacles: [
        {
            coords: { lat: 22.95, lng: 39.05 },
            id: 'rival-juhfa-corridor',
            label: 'Rival Collector',
            patrolRadius: 26_000,
            radius: 48_000,
            type: 'rival',
        },
        {
            coords: { lat: 23.36, lng: 39.01 },
            id: 'wadi-flood',
            label: 'Wadi Flood',
            radius: 60_000,
            type: 'flood',
        },
        {
            coords: { lat: 24.14, lng: 39.32 },
            id: 'guard-patrol',
            label: 'Guard Patrol',
            patrolRadius: 20_000,
            radius: 44_000,
            type: 'guard',
        },
    ],
    order: 2,
    origin: { lat: 21.42, lng: 39.83 },
    playable: true,
    subtitle: 'The Arabian Heartland: Makkah to Madinah',
    teachers: [
        {
            ...getTeacherProfile('ibn-abi-uways'),
            city: 'Makkah',
            coords: { lat: 21.43, lng: 39.84 },
        },
        {
            ...getTeacherProfile('abdullah-ibn-yusuf'),
            city: 'Badr',
            coords: { lat: 23.72, lng: 38.84 },
        },
        {
            ...getTeacherProfile('ali-ibn-al-madini'),
            city: 'Madinah',
            coords: { lat: 24.47, lng: 39.61 },
        },
    ],
    teaser: 'Playable Hijaz chapter with three scholar encounters, tighter route spacing, and denser caravan hazards.',
    winCondition: {
        finalMilestone: 'prophets-mosque',
        requiredHadith: 36,
        requiredTeachers: ['ali-ibn-al-madini', 'abdullah-ibn-yusuf', 'ibn-abi-uways'],
    },
};
