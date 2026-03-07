import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as levels from '@/game/levels';
import { level1 } from '@/game/levels/level1';
import { level2 } from '@/game/levels/level2';
import { resetGameStore, useGameStore } from '@/game/store/game.store';
import { LevelCompleteRoute } from '@/routes/game/complete';

describe('LevelCompleteRoute', () => {
    beforeEach(() => {
        resetGameStore();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the last completion summary without a continue CTA for scaffold chapters', () => {
        useGameStore.setState({
            currentLevel: 2,
            lastCompletion: {
                completionNarration: 'Completion narration placeholder.',
                historicalNote: 'Historical note placeholder.',
                levelId: 'level-1',
                levelName: 'Level 1',
                levelSubtitle: 'The First Steps: Bukhara to Makkah',
                teachersMet: 1,
                timeTakenSeconds: 84,
                tokensLost: 6,
                verifiedHadith: 30,
            },
            selectedCharacter: 'bukhari',
            totalHadithVerified: 30,
            unlockedLevels: [1, 2],
        });

        render(
            <MemoryRouter>
                <LevelCompleteRoute />
            </MemoryRouter>,
        );

        expect(screen.getByText(/The First Steps: Bukhara to Makkah/i)).toBeInTheDocument();
        expect(screen.getByText(/Completion narration placeholder./i)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /continue athar/i })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
    });

    it('renders the continue CTA when the next unlocked level is playable', () => {
        vi.spyOn(levels, 'getLevelById').mockImplementation((levelId) => {
            if (levelId === 'level-1') {
                return level1;
            }

            if (levelId === 'level-2') {
                return {
                    ...level2,
                    playable: true,
                };
            }

            return null;
        });

        useGameStore.setState({
            currentLevel: 2,
            lastCompletion: {
                completionNarration: 'Completion narration placeholder.',
                historicalNote: 'Historical note placeholder.',
                levelId: 'level-1',
                levelName: 'Level 1',
                levelSubtitle: 'The First Steps: Bukhara to Makkah',
                teachersMet: 1,
                timeTakenSeconds: 84,
                tokensLost: 6,
                verifiedHadith: 30,
            },
            selectedCharacter: 'bukhari',
            totalHadithVerified: 30,
            unlockedLevels: [1, 2],
        });

        render(
            <MemoryRouter>
                <LevelCompleteRoute />
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: /continue athar/i })).toHaveAttribute('href', '/game/level-2');
        expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
    });
});
