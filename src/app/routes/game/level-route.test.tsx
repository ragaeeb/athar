import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GameLevelRoute } from '@/app/routes/game/level-route';
import { level1 } from '@/content/levels/level-1/config';
import { resetGameStore, useGameStore } from '@/features/gameplay/state/game.store';
import { resetLevelStore, useLevelStore } from '@/features/gameplay/state/level.store';
import { resetPlayerStore, usePlayerStore } from '@/features/gameplay/state/player.store';
import { resetGameplaySessionStore, useGameplaySessionStore } from '@/features/gameplay/state/session.store';

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
                loader: () => ({ level: level1 }),
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

        expect(await screen.findByText(/journey paused/i)).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Makki ibn Ibrahim')).toBeInTheDocument();
        expect(useGameplaySessionStore.getState().paused).toBe(true);

        const resumeButtons = await screen.findAllByRole('button', { name: /resume journey/i });
        fireEvent.click(resumeButtons.at(-1)!);

        await waitFor(() => {
            expect(screen.queryByText(/journey paused/i)).not.toBeInTheDocument();
        });
        expect(useGameplaySessionStore.getState().paused).toBe(false);
    });

    it('restarts the chapter from a clean session state', async () => {
        renderRoute();

        await screen.findByRole('button', { name: /pause journey/i });

        usePlayerStore.getState().addToken(7);
        useLevelStore.getState().completeTeacher('makki-ibn-ibrahim');
        useLevelStore.getState().addLockedHadith(3);

        fireEvent.click(screen.getByRole('button', { name: /pause journey/i }));
        fireEvent.click(await screen.findByRole('button', { name: /restart chapter/i }));

        await waitFor(() => {
            expect(useGameplaySessionStore.getState().paused).toBe(false);
            expect(usePlayerStore.getState().hadithTokens).toBe(0);
            expect(useLevelStore.getState().lockedHadith).toBe(0);
            expect(useLevelStore.getState().completedTeacherIds).toEqual([]);
        });
    });
});
