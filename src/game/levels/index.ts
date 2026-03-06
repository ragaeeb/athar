import type { LevelConfig } from './level.types';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import { level4 } from './level4';
import { level5 } from './level5';

export const LEVEL_REGISTRY: LevelConfig[] = [level1, level2, level3, level4, level5];

export const LEVEL_REGISTRY_BY_ID = Object.fromEntries(LEVEL_REGISTRY.map((level) => [level.id, level])) as Record<
    string,
    LevelConfig
>;

export const getLevelById = (levelId: string) => LEVEL_REGISTRY_BY_ID[levelId] ?? null;
