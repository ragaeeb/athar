import type { LoaderFunctionArgs } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { gameLevelLoader } from '@/app/routes/game/level.loader';
import * as levelRegistry from '@/content/levels/registry';

const createLoaderArgs = (levelId?: string): LoaderFunctionArgs =>
    ({
        context: undefined,
        params: levelId ? { levelId } : {},
        request: new Request(`https://athar.test/game/${levelId ?? ''}`),
    }) as LoaderFunctionArgs;

const captureLoaderError = (args: LoaderFunctionArgs) => {
    try {
        gameLevelLoader(args);
    } catch (error) {
        return error;
    }

    throw new Error('Expected loader to throw');
};

describe('gameLevelLoader', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns validated level data for a known chapter', () => {
        const result = gameLevelLoader(createLoaderArgs('level-1'));

        expect(result.level.id).toBe('level-1');
        expect(result.level.playable).toBe(true);
    });

    it('throws a 400 response when the route param is missing', async () => {
        const error = captureLoaderError(createLoaderArgs());

        expect(error).toBeInstanceOf(Response);

        if (error instanceof Response) {
            expect(error.status).toBe(400);
            await expect(error.text()).resolves.toContain('Missing chapter id.');
        }
    });

    it('throws a 404 response for an unknown chapter id', async () => {
        const error = captureLoaderError(createLoaderArgs('missing-level'));

        expect(error).toBeInstanceOf(Response);

        if (error instanceof Response) {
            expect(error.status).toBe(404);
            await expect(error.text()).resolves.toContain('Unknown chapter "missing-level".');
        }
    });

    it('throws a 500 response when authored chapter content fails validation', async () => {
        vi.spyOn(levelRegistry, 'getLevelDefinitionById').mockReturnValue({
            id: 'level-1',
            playable: true,
        });

        const error = captureLoaderError(createLoaderArgs('level-1'));

        expect(error).toBeInstanceOf(Response);

        if (error instanceof Response) {
            expect(error.status).toBe(500);
            expect(error.statusText).toBe('Invalid chapter content');
            await expect(error.text()).resolves.toContain('failed validation before route mount');
        }
    });
});
