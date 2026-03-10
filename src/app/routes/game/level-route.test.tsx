import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GameLevelRoute } from '@/app/routes/game/level-route';
import { DEFAULT_MOVEMENT_SPEED_MULTIPLIER } from '@/app/routes/game/runtime-overrides';
import { level1 } from '@/content/levels/level-1/config';
import { applyLevelRouteVariants } from '@/content/levels/route-variants';
import { parseLevelConfig } from '@/content/levels/schema';
import { resetGameStore, useGameStore } from '@/features/gameplay/state/game.store';
import { resetLevelStore, useLevelStore } from '@/features/gameplay/state/level.store';
import { resetPlayerStore, usePlayerStore } from '@/features/gameplay/state/player.store';
import { resetGameplaySessionStore, useGameplaySessionStore } from '@/features/gameplay/state/session.store';

const { evictLevelSceneAssetsMock, preloadObstacleModelsForLevelMock } = vi.hoisted(() => ({
    evictLevelSceneAssetsMock: vi.fn(),
    preloadObstacleModelsForLevelMock: vi.fn(),
}));

vi.mock('@/features/audio/audio-manager', () => ({
    audioManager: {
        disposeAll: vi.fn(),
        setAmbient: vi.fn(),
        warmup: vi.fn(),
    },
}));

vi.mock('@/features/debug/dev-tools', () => ({
    useAtharDevTools: vi.fn(),
}));

vi.mock('@/content/models/level-scene-assets', () => ({
    evictLevelSceneAssets: evictLevelSceneAssetsMock,
    preloadObstacleModelsForLevel: preloadObstacleModelsForLevelMock,
}));

vi.mock('@/features/gameplay/controllers/PlayerController', () => ({
    PlayerController: () => <div data-testid="player-controller" />,
}));

vi.mock('@/features/gameplay/presentation/PresentationRuntime', () => ({
    PresentationRuntime: () => <div data-testid="presentation-runtime" />,
}));

vi.mock('@/features/gameplay/systems/GameLoop', () => ({
    GameLoop: () => <div data-testid="game-loop" />,
}));

vi.mock('@/features/hud/components/HUD', () => ({
    HUD: () => <div data-testid="hud" />,
}));

vi.mock('@/features/map/components/LevelMap', () => ({
    LevelMap: () => <div data-testid="level-map" />,
}));

vi.mock('@/features/map/components/MapRuntimeBoundary', () => ({
    MapRuntimeBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/features/map/components/MapScene', () => ({
    MapScene: ({ children }: { children: React.ReactNode }) => <div data-testid="map-scene">{children}</div>,
}));

const renderRoute = () => {
    const router = createMemoryRouter(
        [
            {
                element: <GameLevelRoute />,
                HydrateFallback: () => null,
                loader: ({ request }) => ({
                    level: applyLevelRouteVariants(parseLevelConfig(level1), request.url),
                    runtimeOverrides: {
                        movementSpeedMultiplier: DEFAULT_MOVEMENT_SPEED_MULTIPLIER,
                    },
                }),
                path: '/game/level-1',
            },
        ],
        {
            initialEntries: ['/game/level-1'],
        },
    );

    return render(<RouterProvider router={router} />);
};

describe('GameLevelRoute', () => {
    beforeEach(() => {
        resetGameStore();
        resetLevelStore();
        resetPlayerStore();
        resetGameplaySessionStore();
        evictLevelSceneAssetsMock.mockReset();
        useGameStore.setState({
            currentLevel: 1,
            unlockedLevels: [1],
        });
    });

    it('shows a pause overlay with a debug snapshot and resumes cleanly', async () => {
        renderRoute();

        await screen.findByRole('button', { name: /pause journey/i });

        usePlayerStore.getState().addToken(5);
        useLevelStore.getState().completeTeacher('makki-ibn-ibrahim');

        fireEvent.click(screen.getByRole('button', { name: /pause journey/i }));

        await waitFor(() => {
            expect(useGameplaySessionStore.getState().paused).toBe(true);
        });
        expect((await screen.findAllByRole('button', { name: /resume journey/i })).at(-1)).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Makki ibn Ibrahim')).toBeInTheDocument();

        const resumeButtons = await screen.findAllByRole('button', { name: /resume journey/i });
        fireEvent.click(resumeButtons.at(-1)!);

        await waitFor(() => {
            expect(useGameplaySessionStore.getState().paused).toBe(false);
        });
        expect(screen.queryByRole('button', { name: /resume journey/i })).not.toBeInTheDocument();
    });

    it('restarts the chapter from a clean session state', async () => {
        renderRoute();

        await screen.findByRole('button', { name: /pause journey/i });

        usePlayerStore.getState().addToken(7);
        useLevelStore.getState().completeTeacher('makki-ibn-ibrahim');
        useLevelStore.getState().addLockedHadith(3);
        useGameStore.setState({ totalHadithVerified: 19 });

        fireEvent.click(screen.getByRole('button', { name: /pause journey/i }));
        fireEvent.click(await screen.findByRole('button', { name: /restart chapter/i }));

        await waitFor(() => {
            expect(useGameplaySessionStore.getState().paused).toBe(false);
            expect(usePlayerStore.getState().hadithTokens).toBe(0);
            expect(useLevelStore.getState().lockedHadith).toBe(0);
            expect(useLevelStore.getState().completedTeacherIds).toEqual([]);
            expect(useGameStore.getState().totalHadithVerified).toBe(19);
        });
    });

    it('shows a defeat overlay and lets the chapter restart cleanly', async () => {
        renderRoute();

        await screen.findByRole('button', { name: /pause journey/i });

        useGameplaySessionStore.getState().showDefeat({
            detail: 'The scorpion closed the route before escape.',
            title: 'Scorpion Ambush',
        });

        expect(await screen.findByText(/route broken/i)).toBeInTheDocument();
        expect(screen.getByText(/scorpion ambush/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /restart chapter/i }));

        await waitFor(() => {
            expect(useGameplaySessionStore.getState().defeat).toBeNull();
            expect(useGameplaySessionStore.getState().paused).toBe(false);
        });
    });

    it('evicts chapter scene assets when the gameplay route unmounts', async () => {
        const view = renderRoute();

        await screen.findByRole('button', { name: /pause journey/i });
        expect(preloadObstacleModelsForLevelMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'level-1' }));

        view.unmount();

        expect(evictLevelSceneAssetsMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'level-1' }), 'bukhari');
    });

    it('reinitializes the chapter when query-based route variants change for the same level id', async () => {
        const router = createMemoryRouter(
            [
                {
                    element: <GameLevelRoute />,
                    HydrateFallback: () => null,
                    loader: ({ request }) => ({
                        level: applyLevelRouteVariants(parseLevelConfig(level1), request.url),
                        runtimeOverrides: {
                            movementSpeedMultiplier: DEFAULT_MOVEMENT_SPEED_MULTIPLIER,
                        },
                    }),
                    path: '/game/level-1',
                },
            ],
            {
                initialEntries: ['/game/level-1'],
            },
        );

        render(<RouterProvider router={router} />);

        await screen.findByRole('button', { name: /pause journey/i });

        const defaultClusterRadius = useLevelStore.getState().config?.hadithTokenClusters[0]?.radius;

        await router.navigate('/game/level-1?atharCompactRoute=1');

        await waitFor(() => {
            expect(useLevelStore.getState().config?.hadithTokenClusters[0]?.radius).toBeLessThan(
                defaultClusterRadius ?? 0,
            );
        });
    });
});
