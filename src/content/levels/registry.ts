import { level1 } from '@/content/levels/level-1/config';
import { level2 } from '@/content/levels/level-2/config';
import { level3 } from '@/content/levels/level-3/config';
import { level4 } from '@/content/levels/level-4/config';
import { level5 } from '@/content/levels/level-5/config';
import { levelConfigSchema } from '@/content/levels/schema';
import type { LevelConfig } from '@/content/levels/types';

const LEVEL_DEFINITIONS = [level1, level2, level3, level4, level5];

export type LevelRegistryDiagnostic = {
    issues: string[];
    levelId: string;
};

const levelValidationResults = LEVEL_DEFINITIONS.map((definition) => {
    const result = levelConfigSchema.safeParse(definition);
    const levelId =
        typeof definition === 'object' && definition !== null && 'id' in definition && typeof definition.id === 'string'
            ? definition.id
            : 'unknown-level';

    return {
        levelId,
        result,
    };
});

export const LEVEL_REGISTRY_DIAGNOSTICS: LevelRegistryDiagnostic[] = levelValidationResults.flatMap(
    ({ levelId, result }) =>
        result.success
            ? []
            : [
                  {
                      issues: result.error.issues.map((issue) => issue.message),
                      levelId,
                  },
              ],
);

export const LEVEL_REGISTRY: LevelConfig[] = levelValidationResults.flatMap(({ result }) =>
    result.success ? [result.data as LevelConfig] : [],
);

export const LEVEL_REGISTRY_BY_ID = Object.fromEntries(LEVEL_REGISTRY.map((level) => [level.id, level])) as Record<
    string,
    LevelConfig
>;

const LEVEL_DEFINITIONS_BY_ID = Object.fromEntries(LEVEL_DEFINITIONS.map((level) => [level.id, level])) as Record<
    string,
    unknown
>;

export const getLevelDefinitionById = (levelId: string) => LEVEL_DEFINITIONS_BY_ID[levelId] ?? null;
export const getLevelById = (levelId: string) => LEVEL_REGISTRY_BY_ID[levelId] ?? null;
