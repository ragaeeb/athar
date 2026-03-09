import type { LoaderFunctionArgs } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { gameLevelLoader } from '@/app/routes/game/level.loader';
import { level1 } from '@/content/levels/level-1/config';
import * as levelRegistry from '@/content/levels/registry';
import { worldDistanceInMeters } from '@/shared/geo';

const createLoaderArgs = (levelId?: string, search = ''): LoaderFunctionArgs =>
    ({
        context: undefined,
        params: levelId ? { levelId } : {},
        request: new Request(`https://athar.test/game/${levelId ?? ''}${search}`),
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
        expect(result.runtimeOverrides.movementSpeedMultiplier).toBe(1);
    });

    it('supports a compact-route query variant for fast milestone testing', () => {
        const result = gameLevelLoader(createLoaderArgs('level-1', '?atharCompactRoute=1'));
        const defaultFinalMilestone = level1.milestones.find(
            (milestone) => milestone.id === level1.winCondition.finalMilestone,
        );
        const compactFinalMilestone = result.level.milestones.find(
            (milestone) => milestone.id === result.level.winCondition.finalMilestone,
        );

        expect(compactFinalMilestone).toBeDefined();
        expect(defaultFinalMilestone).toBeDefined();
        expect(result.level.initialView.zoom).toBeGreaterThan(level1.initialView.zoom);
        expect(
            worldDistanceInMeters(compactFinalMilestone?.coords ?? result.level.origin, result.level.origin),
        ).toBeLessThan(worldDistanceInMeters(defaultFinalMilestone?.coords ?? level1.origin, level1.origin));
    });

    it('supports a walk-speed query override for quick traversal testing', () => {
        const result = gameLevelLoader(createLoaderArgs('level-1', '?atharWalkSpeed=4.5'));

        expect(result.runtimeOverrides.movementSpeedMultiplier).toBe(4.5);
    });

    it('clamps invalid or extreme walk-speed query overrides safely', () => {
        expect(gameLevelLoader(createLoaderArgs('level-1', '?atharWalkSpeed=fast')).runtimeOverrides).toEqual({
            movementSpeedMultiplier: 1,
        });
        expect(gameLevelLoader(createLoaderArgs('level-1', '?atharWalkSpeed=-2')).runtimeOverrides).toEqual({
            movementSpeedMultiplier: 0.1,
        });
        expect(gameLevelLoader(createLoaderArgs('level-1', '?atharWalkSpeed=999')).runtimeOverrides).toEqual({
            movementSpeedMultiplier: 20,
        });
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
