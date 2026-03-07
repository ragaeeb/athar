export type CharacterType = 'bukhari' | 'muslim' | 'abu-dawud' | 'tirmidhi';

export type CharacterConfig = {
    id: CharacterType;
    name: string;
    title: string;
    description: string;
    statLabel: string;
    robeColor: string;
    accentColor: string;
    speedMultiplier: number;
    tokenRadiusMultiplier: number;
    obstacleDamageMultiplier: number;
    modelPath: string | null;
};

export type AudioCue =
    | 'ambient-desert'
    | 'ambient-city'
    | 'collect-token'
    | 'lose-token'
    | 'teacher-encounter'
    | 'receive-hadith'
    | 'obstacle-hit'
    | 'level-complete';

export const FEATURE_FLAGS = {
    useCharacterGlb: true,
    useMilestoneIfc: false,
    useTeacherGlb: false,
} as const;

export const PLAYER_MODEL_PATH = '/models/player.glb';

import type { StyleSpecification } from 'maplibre-gl';

const rasterStyle = (variant: 'light_nolabels' | 'dark_nolabels'): StyleSpecification => ({
    layers: [{ id: 'carto-basemap', source: 'carto-raster', type: 'raster' }],
    sources: {
        'carto-raster': {
            attribution: '© OpenStreetMap contributors, © CARTO',
            tileSize: 256,
            tiles: [
                `https://a.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
                `https://b.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
                `https://c.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
                `https://d.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
            ],
            type: 'raster',
        },
    },
    version: 8,
});

export const MAP_STYLES = {
    city: rasterStyle('dark_nolabels'),
    desert: rasterStyle('light_nolabels'),
};

export const CHARACTER_CONFIGS: Record<CharacterType, CharacterConfig> = {
    'abu-dawud': {
        accentColor: '#9ec5ff',
        description: 'Draws in hadith tokens from a wider radius during encounters.',
        id: 'abu-dawud',
        modelPath: PLAYER_MODEL_PATH,
        name: 'Abu Dawud al-Sijistani',
        obstacleDamageMultiplier: 1,
        robeColor: '#355caa',
        speedMultiplier: 1,
        statLabel: 'Wider token radius',
        title: 'Chain Gatherer',
        tokenRadiusMultiplier: 1.35,
    },
    bukhari: {
        accentColor: '#f4d35e',
        description: 'Balanced traveler with steady movement and standard hadith collection.',
        id: 'bukhari',
        modelPath: PLAYER_MODEL_PATH,
        name: 'Al-Bukhari',
        obstacleDamageMultiplier: 1,
        robeColor: '#158a8a',
        speedMultiplier: 1,
        statLabel: 'Balanced scholar',
        title: 'Canonical Scholar',
        tokenRadiusMultiplier: 1,
    },
    muslim: {
        accentColor: '#f0b429',
        description: 'Moves faster along the caravan road and crosses long gaps quickly.',
        id: 'muslim',
        modelPath: PLAYER_MODEL_PATH,
        name: 'Muslim b. al-Hajjaj',
        obstacleDamageMultiplier: 1,
        robeColor: '#a16a2d',
        speedMultiplier: 1.2,
        statLabel: 'Faster movement',
        title: 'Swift Collector',
        tokenRadiusMultiplier: 1,
    },
    tirmidhi: {
        accentColor: '#dbc6a6',
        description: 'Obstacles disrupt momentum but spare more of the gathered tokens.',
        id: 'tirmidhi',
        modelPath: PLAYER_MODEL_PATH,
        name: 'Abu Isa al-Tirmidhi',
        obstacleDamageMultiplier: 0.5,
        robeColor: '#6b4b3e',
        speedMultiplier: 0.95,
        statLabel: 'Obstacles slow instead of breaking flow',
        title: 'Steadfast Critic',
        tokenRadiusMultiplier: 1,
    },
};

export const DEFAULT_CHARACTER: CharacterType = 'bukhari';

export const BASE_PLAYER_SPEED_METERS_PER_SECOND = 45_000;
export const TOKEN_COLLECTION_RADIUS_METERS = 40_000;
export const TEACHER_INTERACTION_RADIUS_METERS = 65_000;
export const MILESTONE_RADIUS_METERS = 90_000;
export const OBSTACLE_TRIGGER_RADIUS_METERS = 55_000;
export const SCRAMBLE_DURATION_MS = 5_000;
export const SCATTER_DURATION_MS = 8_000;
export const OBSTACLE_HIT_COOLDOWN_MS = 2_500;
export const OBJECTIVE_GOLD_RADIUS_METERS = 50_000;
export const PLAYER_VISUAL_SCALE = 4_000;
export const TEACHER_VISUAL_SCALE = 4_500;
export const TOKEN_VISUAL_SCALE = 2_600;
export const OBSTACLE_VISUAL_SCALE = 3_500;
export const MILESTONE_VISUAL_SCALE = 4_200;
export const NAVIGATION_ARROW_VISUAL_SCALE = 3_200;
export const MAP_LABEL_FONT_SIZE = 10_000;

export const AUDIO_ASSETS: Record<AudioCue, string> = {
    'ambient-city': '/audio/ambient-city.mp3',
    'ambient-desert': '/audio/ambient-desert.mp3',
    'collect-token': '/audio/collect-token.mp3',
    'level-complete': '/audio/level-complete.mp3',
    'lose-token': '/audio/lose-token.mp3',
    'obstacle-hit': '/audio/obstacle-hit.mp3',
    'receive-hadith': '/audio/receive-hadith.mp3',
    'teacher-encounter': '/audio/teacher-encounter.mp3',
};
