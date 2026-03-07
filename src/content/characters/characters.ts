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

export const PLAYER_MODEL_PATH = '/models/characters/player.glb';

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
