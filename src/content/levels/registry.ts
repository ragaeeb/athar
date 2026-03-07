import { level1 } from '@/content/levels/level-1/config';
import { level2 } from '@/content/levels/level-2/config';
import { level3 } from '@/content/levels/level-3/config';
import { level4 } from '@/content/levels/level-4/config';
import { level5 } from '@/content/levels/level-5/config';
import type { LevelConfig } from '@/content/levels/types';

export const validateLevelConfig = (config: LevelConfig) => {
    const teacherIds = new Set(config.teachers.map((teacher) => teacher.id));
    const milestoneIds = new Set(config.milestones.map((milestone) => milestone.id));
    const missingTeachers = config.winCondition.requiredTeachers.filter((teacherId) => !teacherIds.has(teacherId));

    if (missingTeachers.length > 0) {
        throw new Error(
            `Level "${config.id}" is misconfigured: missing required teacher IDs: ${missingTeachers.join(', ')}`,
        );
    }

    if (!milestoneIds.has(config.winCondition.finalMilestone)) {
        throw new Error(
            `Level "${config.id}" is misconfigured: missing final milestone "${config.winCondition.finalMilestone}"`,
        );
    }

    return config;
};

export const LEVEL_REGISTRY: LevelConfig[] = [level1, level2, level3, level4, level5].map(validateLevelConfig);

export const LEVEL_REGISTRY_BY_ID = Object.fromEntries(LEVEL_REGISTRY.map((level) => [level.id, level])) as Record<
    string,
    LevelConfig
>;

export const getLevelById = (levelId: string) => LEVEL_REGISTRY_BY_ID[levelId] ?? null;
