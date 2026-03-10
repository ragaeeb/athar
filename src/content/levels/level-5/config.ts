import { createLevelCompletionContent } from '@/content/levels/completion-content';
import type { LevelConfig } from '@/content/levels/types';
import { getTeacherProfile } from '@/content/scholars/scholar-profiles';
import { MAP_STYLES } from '@/features/map/lib/map-style';

export const level5: LevelConfig = {
    ambientCue: 'ambient-city',
    completionContent: createLevelCompletionContent({
        eyebrow: 'Journey Complete',
        historicalNoteTitle: 'Legacy Note',
        homeActionLabel: 'Return Home',
        nextChapterTitle: 'Legacy of the Journey',
        reviewActionLabel: 'Review the Legacy',
    }),
    completionNarration:
        'The final chapter closes when the road through Syria, the coast, and Egypt resolves into a compiled ledger. The player is no longer just surviving the route or meeting teachers one by one; the journey now has to hold together as a complete body of preserved reports.',
    hadithTokenClusters: [
        {
            center: { lat: 33.51, lng: 36.29 },
            count: 16,
            id: 'damascus-ledgers',
            label: 'Damascus teaching ledgers',
            radius: 18_000,
        },
        {
            center: { lat: 32.5, lng: 34.9 },
            count: 14,
            id: 'coastal-archive-rolls',
            label: 'Coastal archive rolls',
            radius: 22_000,
        },
        {
            center: { lat: 30.04, lng: 31.24 },
            count: 16,
            id: 'fustat-scriptorium-notes',
            label: 'Fustat scriptorium notes',
            radius: 18_000,
        },
        {
            center: { lat: 31.2, lng: 29.92 },
            count: 18,
            id: 'alexandria-compilation-sheets',
            label: 'Alexandria compilation sheets',
            radius: 16_000,
        },
    ],
    historicalNote:
        'This finale compresses the later scholarly arc into Damascus, the Levantine coast, Fustat, and Alexandria. Instead of introducing new systems, it reuses the proven route architecture and asks the player to complete a full chain with enough verified material to make the final compilation feel earned.',
    id: 'level-5',
    initialView: {
        bearing: 18,
        latitude: 32.4,
        longitude: 33.8,
        pitch: 60,
        zoom: 5.5,
    },
    lighting: { hour: 17, label: 'Final golden-hour light', minute: 45 },
    mapStyle: MAP_STYLES.city,
    milestones: [
        {
            buildingType: 'madrasa',
            coords: { lat: 33.51, lng: 36.29 },
            id: 'damascus-review-court',
            label: 'Damascus Review Court',
            missionText:
                'Open the final circuit in Damascus and gather the first ledgers without losing the route to guard scrutiny.',
        },
        {
            buildingType: 'market',
            coords: { lat: 32.5, lng: 34.9 },
            id: 'caesarea-port',
            label: 'Caesarea Port',
            missionText:
                'Cross the coast, secure the Levantine teacher, and keep the satchel intact through the rival corridor.',
        },
        {
            buildingType: 'madrasa',
            coords: { lat: 30.04, lng: 31.24 },
            id: 'fustat-scriptorium',
            label: 'Fustat Scriptorium',
            missionText:
                'Reach Fustat with enough preserved material to survive the Nile pressure and prepare the final compilation sheets.',
        },
        {
            buildingType: 'minaret',
            coords: { lat: 31.2, lng: 29.92 },
            id: 'alexandria-compilation-house',
            label: 'Alexandria Compilation House',
            missionText:
                'Bring the final teacher chain and a complete satchel of preserved hadith into Alexandria to close the journey.',
        },
    ],
    name: 'Level 5',
    namedAreas: [
        { coords: { lat: 33.51, lng: 36.29 }, id: 'damascus', label: 'Damascus' },
        { coords: { lat: 32.5, lng: 34.9 }, id: 'caesarea', label: 'Caesarea' },
        { coords: { lat: 30.04, lng: 31.24 }, id: 'fustat', label: 'Fustat' },
        { coords: { lat: 31.2, lng: 29.92 }, id: 'alexandria', label: 'Alexandria' },
    ],
    narrative:
        'The finale stretches from Damascus through the Levantine coast into Egypt. It is not the densest chapter, but it is the most cumulative: the player must carry the lessons of the earlier routes into a last chain of teachers, hazards, and compilation milestones.',
    obstacles: [
        {
            coords: { lat: 33.11, lng: 35.73 },
            id: 'damascus-guard-ring',
            label: 'Guard Ring',
            patrolRadius: 18_000,
            radius: 44_000,
            type: 'guard',
        },
        {
            coords: { lat: 32.12, lng: 34.65 },
            id: 'coastal-rival-belt',
            label: 'Rival Collector',
            patrolRadius: 22_000,
            radius: 46_000,
            type: 'rival',
        },
        {
            coords: { lat: 30.78, lng: 31.03 },
            id: 'delta-floodplain',
            label: 'Delta Floodplain',
            radius: 58_000,
            type: 'flood',
        },
        {
            coords: { lat: 31.53, lng: 30.61 },
            id: 'alexandria-sand-belt',
            label: 'Sand Belt',
            radius: 86_000,
            type: 'sandstorm',
        },
    ],
    order: 5,
    origin: { lat: 33.51, lng: 36.29 },
    playable: true,
    subtitle: 'The Grand Finale: Syria, Egypt, and the Compilation',
    teachers: [
        {
            ...getTeacherProfile('abdullah-ibn-yusuf'),
            city: 'Damascus',
            coords: { lat: 33.51, lng: 36.29 },
        },
        {
            ...getTeacherProfile('muhammad-ibn-yusuf-al-firyabi'),
            city: 'Caesarea',
            coords: { lat: 32.5, lng: 34.9 },
        },
    ],
    teaser: 'Playable finale chapter with the Levant-to-Egypt route, final scholar chain, and the closing compilation arc.',
    winCondition: {
        finalMilestone: 'alexandria-compilation-house',
        requiredHadith: 60,
        requiredTeachers: ['abdullah-ibn-yusuf', 'muhammad-ibn-yusuf-al-firyabi'],
    },
};
