import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetGameStore, useGameStore } from '@/game/store/game.store';
import { LevelCompleteRoute } from '@/routes/game/complete';

describe('LevelCompleteRoute', () => {
    beforeEach(() => {
        resetGameStore();
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
});
