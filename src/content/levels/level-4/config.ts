import { createLevelCompletionContent } from '@/content/levels/completion-content';
import type { LevelConfig } from '@/content/levels/types';
import { getTeacherProfile } from '@/content/scholars/scholar-profiles';
import { MAP_STYLES } from '@/features/map/lib/map-style';

export const level4: LevelConfig = {
    ambientCue: 'ambient-desert',
    completionContent: createLevelCompletionContent({
        eyebrow: 'Eastern Route Complete',
        nextChapterActionLabel: 'Begin the Finale',
        nextChapterTitle: 'Next Journey: The Final Compilation',
    }),
    completionNarration: 'Planned phase placeholder.',
    hadithTokenClusters: [],
    historicalNote: 'Future phase placeholder.',
    id: 'level-4',
    initialView: {
        bearing: 12,
        latitude: 35.6,
        longitude: 51.4,
        pitch: 58,
        zoom: 5.7,
    },
    lighting: { hour: 18, label: 'Dusk', minute: 0 },
    mapStyle: MAP_STYLES.desert,
    milestones: [
        {
            buildingType: 'caravanserai',
            coords: { lat: 36.21, lng: 58.79 },
            id: 'merv-finale',
            label: 'Merv Finale',
            missionText: 'Placeholder finale milestone for the future eastern route chapter.',
        },
    ],
    name: 'Level 4',
    namedAreas: [],
    narrative: 'Future phase: desert survival leg with dusk lighting and the harshest long-route hazards.',
    obstacles: [],
    order: 4,
    origin: { lat: 35.6, lng: 51.4 },
    playable: false,
    subtitle: 'Persia and the East: Ray, Nishapur, Merv',
    teachers: [{ ...getTeacherProfile('ishaq-ibn-rahwayh'), coords: { lat: 36.21, lng: 58.79 } }],
    teaser: 'Planned later: desert-heavy survival route with dusk sunlight.',
    winCondition: {
        finalMilestone: 'merv-finale',
        requiredHadith: 80,
        requiredTeachers: ['ishaq-ibn-rahwayh'],
    },
};
