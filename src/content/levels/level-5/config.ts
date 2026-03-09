import { createLevelCompletionContent } from '@/content/levels/completion-content';
import type { LevelConfig } from '@/content/levels/types';
import { getTeacherProfile } from '@/content/scholars/scholar-profiles';
import { MAP_STYLES } from '@/features/map/lib/map-style';

export const level5: LevelConfig = {
    ambientCue: 'ambient-city',
    completionContent: createLevelCompletionContent({
        eyebrow: 'Compilation Complete',
        nextChapterTitle: 'Legacy of the Journey',
    }),
    completionNarration: 'Planned phase placeholder.',
    hadithTokenClusters: [],
    historicalNote: 'Future phase placeholder.',
    id: 'level-5',
    initialView: {
        bearing: 15,
        latitude: 33.5,
        longitude: 36.3,
        pitch: 60,
        zoom: 5.2,
    },
    lighting: { hour: 17, label: 'Golden hour', minute: 30 },
    mapStyle: MAP_STYLES.city,
    milestones: [
        {
            buildingType: 'market',
            coords: { lat: 32.5, lng: 34.9 },
            id: 'compilation-finale',
            label: 'Compilation Finale',
            missionText: 'Placeholder finale milestone for the future compilation chapter.',
        },
    ],
    name: 'Level 5',
    namedAreas: [],
    narrative: 'Future phase: final multi-city leg, simultaneous hazards, and the compilation ending sequence.',
    obstacles: [],
    order: 5,
    origin: { lat: 33.5, lng: 36.3 },
    playable: false,
    subtitle: 'The Grand Finale: Syria, Egypt, and the Compilation',
    teachers: [
        {
            ...getTeacherProfile('muhammad-ibn-yusuf-al-firyabi'),
            coords: { lat: 32.5, lng: 34.9 },
        },
    ],
    teaser: 'Planned finale: Levant and Egypt route with the final compilation sequence.',
    winCondition: {
        finalMilestone: 'compilation-finale',
        requiredHadith: 100,
        requiredTeachers: ['muhammad-ibn-yusuf-al-firyabi'],
    },
};
