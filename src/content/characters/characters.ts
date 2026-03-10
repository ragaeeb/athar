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
    guardLossMultiplier: number;
    rivalLossMultiplier: number;
    scrambleDurationMultiplier: number;
    modelPath: string | null;
};

export const PLAYER_MODEL_PATH = '/models/characters/player.glb';

export const CHARACTER_CONFIGS: Record<CharacterType, CharacterConfig> = {
    'abu-dawud': {
        accentColor: '#9ec5ff',
        description: 'Draws in hadith tokens from a wider radius during encounters.',
        guardLossMultiplier: 1,
        id: 'abu-dawud',
        modelPath: PLAYER_MODEL_PATH,
        name: 'Abu Dawud al-Sijistani',
        obstacleDamageMultiplier: 1,
        rivalLossMultiplier: 0.6,
        robeColor: '#355caa',
        scrambleDurationMultiplier: 1,
        speedMultiplier: 1,
        statLabel: 'Wide gathers, lighter rival theft',
        title: 'Chain Gatherer',
        tokenRadiusMultiplier: 1.35,
    },
    bukhari: {
        accentColor: '#f4d35e',
        description: 'Balanced traveler with steady movement and no special hazard bias.',
        guardLossMultiplier: 1,
        id: 'bukhari',
        modelPath: PLAYER_MODEL_PATH,
        name: 'Al-Bukhari',
        obstacleDamageMultiplier: 1,
        rivalLossMultiplier: 1,
        robeColor: '#158a8a',
        scrambleDurationMultiplier: 1,
        speedMultiplier: 1,
        statLabel: 'Balanced scholar',
        title: 'Canonical Scholar',
        tokenRadiusMultiplier: 1,
    },
    muslim: {
        accentColor: '#f0b429',
        description: 'Moves faster along the caravan road and clears scramble hazards sooner.',
        guardLossMultiplier: 1,
        id: 'muslim',
        modelPath: PLAYER_MODEL_PATH,
        name: 'Muslim b. al-Hajjaj',
        obstacleDamageMultiplier: 1,
        rivalLossMultiplier: 1,
        robeColor: '#a16a2d',
        scrambleDurationMultiplier: 0.55,
        speedMultiplier: 1.2,
        statLabel: 'Fast route, short scramble',
        title: 'Swift Collector',
        tokenRadiusMultiplier: 1,
    },
    tirmidhi: {
        accentColor: '#dbc6a6',
        description: 'Confiscation hazards spare more of the carried satchel and generic hits hurt less.',
        guardLossMultiplier: 0.6,
        id: 'tirmidhi',
        modelPath: PLAYER_MODEL_PATH,
        name: 'Abu Isa al-Tirmidhi',
        obstacleDamageMultiplier: 0.5,
        rivalLossMultiplier: 0.85,
        robeColor: '#6b4b3e',
        scrambleDurationMultiplier: 0.9,
        speedMultiplier: 0.95,
        statLabel: 'Lower confiscation pressure',
        title: 'Steadfast Critic',
        tokenRadiusMultiplier: 1,
    },
};

export const DEFAULT_CHARACTER: CharacterType = 'bukhari';
