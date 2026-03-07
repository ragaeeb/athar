import type { LoaderFunctionArgs } from 'react-router-dom';
import { ZodError } from 'zod';

import { getLevelDefinitionById } from '@/content/levels/registry';
import { parseLevelConfig } from '@/content/levels/schema';
import type { LevelConfig } from '@/content/levels/types';

export type GameLevelLoaderData = {
    level: LevelConfig;
};

export const gameLevelLoader = ({ params }: LoaderFunctionArgs): GameLevelLoaderData => {
    const levelId = params.levelId;
    if (!levelId) {
        throw new Response('Missing chapter id.', { status: 400 });
    }

    const levelDefinition = getLevelDefinitionById(levelId);
    if (!levelDefinition) {
        throw new Response(`Unknown chapter "${levelId}".`, { status: 404 });
    }

    try {
        return { level: parseLevelConfig(levelDefinition) };
    } catch (error) {
        if (error instanceof ZodError) {
            throw new Response(`Chapter "${levelId}" failed validation before route mount.`, {
                status: 500,
                statusText: 'Invalid chapter content',
            });
        }

        throw error;
    }
};
