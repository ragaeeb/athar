import type { StyleSpecification } from 'maplibre-gl';

export type Coords = {
    lat: number;
    lng: number;
};

export type MeterOffset = {
    x: number;
    z: number;
};

export type TeacherConfig = {
    id: string;
    name: string;
    title: string;
    city: string;
    coords: Coords;
    hadith: string;
    hadithSource: string;
    historicalNote: string;
};

export type ObstacleType = 'viper' | 'sandstorm' | 'guard' | 'flood' | 'rival';

export type ObstacleConfig = {
    id: string;
    label: string;
    type: ObstacleType;
    coords: Coords;
    patrolRadius?: number;
    radius?: number;
};

export type MilestoneBuildingType = 'mosque' | 'madrasa' | 'caravanserai' | 'minaret' | 'market';

export type MilestoneConfig = {
    id: string;
    label: string;
    coords: Coords;
    buildingType: MilestoneBuildingType;
    missionText: string;
};

export type HadithTokenCluster = {
    id: string;
    center: Coords;
    count: number;
    radius: number;
    label: string;
};

export type NamedAreaConfig = {
    id: string;
    label: string;
    coords: Coords;
};

export type WinCondition = {
    requiredHadith: number;
    requiredTeachers: string[];
    finalMilestone: string;
};

export type LightingConfig = {
    hour: number;
    minute: number;
    label: string;
};

export type LevelConfig = {
    id: string;
    order: number;
    name: string;
    subtitle: string;
    narrative: string;
    origin: Coords;
    initialView: {
        latitude: number;
        longitude: number;
        zoom: number;
        pitch: number;
        bearing: number;
    };
    mapStyle: string | StyleSpecification;
    playable: boolean;
    teaser: string;
    teachers: TeacherConfig[];
    obstacles: ObstacleConfig[];
    milestones: MilestoneConfig[];
    hadithTokenClusters: HadithTokenCluster[];
    namedAreas: NamedAreaConfig[];
    lighting: LightingConfig;
    winCondition: WinCondition;
    completionNarration: string;
    historicalNote: string;
    ambientCue: 'ambient-desert' | 'ambient-city';
};

export type ObjectiveKind = 'hadith' | 'teacher' | 'milestone';

export type ObjectiveStatus = {
    id: string;
    label: string;
    detail: string;
    kind: ObjectiveKind;
    completed: boolean;
};

export type TokenKind = 'cluster' | 'scattered';

export type TokenState = {
    id: string;
    coords: Coords;
    anchor: Coords;
    localOffsetMeters: MeterOffset;
    kind: TokenKind;
    clusterId?: string | null;
    value: number;
    collected: boolean;
    expiresAt: number | null;
    bounceSeed: number;
};

export type TokenClusterObjective = {
    id: string;
    label: string;
    hint: string;
    coords: Coords;
    kind: 'token-cluster';
    density: number;
};

export type NextObjective = TeacherConfig | MilestoneConfig | TokenClusterObjective | null;

export type LevelCompletionSummary = {
    levelId: string;
    levelName: string;
    levelSubtitle: string;
    verifiedHadith: number;
    teachersMet: number;
    timeTakenSeconds: number;
    tokensLost: number;
    historicalNote: string;
    completionNarration: string;
};
