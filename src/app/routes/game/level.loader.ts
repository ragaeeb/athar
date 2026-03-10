import type { LoaderFunctionArgs } from 'react-router-dom';
import { ZodError } from 'zod';

import {
    DEFAULT_MOVEMENT_SPEED_MULTIPLIER,
    type GameLevelRuntimeOverrides,
    isMovementSpeedMultiplierWithinBounds,
    parseGameLevelRuntimeOverrides,
} from '@/app/routes/game/runtime-overrides';
import { getLevelDefinitionById } from '@/content/levels/registry';
import { applyLevelRouteVariants } from '@/content/levels/route-variants';
import { parseLevelConfig } from '@/content/levels/schema';
import type { LevelConfig } from '@/content/levels/types';

export type GameLevelLoaderData = {
    level: LevelConfig;
    runtimeOverrides: GameLevelRuntimeOverrides;
};

const parseGameLevelLoaderData = (value: unknown): GameLevelLoaderData => {
    if (typeof value !== 'object' || value === null || !('level' in value)) {
        throw new Error('Invalid game level loader data.');
    }

    let runtimeOverrides: GameLevelRuntimeOverrides = {
        movementSpeedMultiplier: DEFAULT_MOVEMENT_SPEED_MULTIPLIER,
    };

    if ('runtimeOverrides' in value) {
        const candidate = value.runtimeOverrides;

        if (
            typeof candidate !== 'object' ||
            candidate === null ||
            !('movementSpeedMultiplier' in candidate) ||
            typeof candidate.movementSpeedMultiplier !== 'number' ||
            !isMovementSpeedMultiplierWithinBounds(candidate.movementSpeedMultiplier)
        ) {
            throw new Error('Invalid game level runtime overrides.');
        }

        runtimeOverrides = {
            movementSpeedMultiplier: candidate.movementSpeedMultiplier,
        };
    }

    return {
        level: parseLevelConfig(value.level),
        runtimeOverrides,
    };
};

export const gameLevelLoader = ({ params, request }: LoaderFunctionArgs): GameLevelLoaderData => {
    const levelId = params.levelId;
    if (!levelId) {
        throw new Response('Missing chapter id.', { status: 400 });
    }

    const levelDefinition = getLevelDefinitionById(levelId);
    if (!levelDefinition) {
        throw new Response(`Unknown chapter "${levelId}".`, { status: 404 });
    }

    try {
        const level = applyLevelRouteVariants(parseLevelConfig(levelDefinition), request.url);

        return {
            level,
            runtimeOverrides: parseGameLevelRuntimeOverrides(request.url),
        } satisfies GameLevelLoaderData;
    } catch (error) {
        if (error instanceof ZodError) {
            throw new Response(`Level "${levelId}" failed validation before route mount.`, {
                status: 500,
                statusText: 'Invalid chapter content',
            });
        }

        throw error;
    }
};

export { parseGameLevelLoaderData };
