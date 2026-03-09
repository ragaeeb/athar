import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LevelCompleteRoute } from '@/app/routes/game/complete';
import { level3 } from '@/content/levels/level-3/config';
import { resetGameStore, useGameStore } from '@/features/gameplay/state/game.store';

describe('LevelCompleteRoute', () => {
    beforeEach(() => {
        resetGameStore();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders a chapter-specific completion summary and surfaces the next scaffold teaser without a continue CTA', () => {
        useGameStore.setState({
            currentLevel: 3,
            lastCompletion: {
                completionNarration: 'Completion narration placeholder.',
                historicalNote: 'Historical note placeholder.',
                levelId: 'level-2',
                levelName: 'Level 2',
                levelSubtitle: 'The Arabian Heartland: Makkah to Madinah',
                teachersMet: 3,
                timeTakenSeconds: 104,
                tokensLost: 4,
                verifiedHadith: 36,
            },
            legacyVerifiedHadithBalance: 0,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 36,
            unlockedLevels: [1, 2, 3],
            verifiedHadithByLevel: { 'level-2': 36 },
        });

        render(
            <MemoryRouter>
                <LevelCompleteRoute />
            </MemoryRouter>,
        );

        expect(screen.getByText(/The Arabian Heartland: Makkah to Madinah/i)).toBeInTheDocument();
        expect(screen.getByText(/Hijaz Circuit Complete/i)).toBeInTheDocument();
        expect(screen.getByText(/Completion narration placeholder./i)).toBeInTheDocument();
        expect(screen.getByText(/Next Journey: The Scholars of Iraq/i)).toBeInTheDocument();
        expect(screen.getByText(level3.teaser)).toBeInTheDocument();
        expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /enter iraq/i })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
    });

    it('renders the chapter-specific continue CTA when the next unlocked level is playable', () => {
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
            legacyVerifiedHadithBalance: 0,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 30,
            unlockedLevels: [1, 2],
            verifiedHadithByLevel: { 'level-1': 30 },
        });

        render(
            <MemoryRouter>
                <LevelCompleteRoute />
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: /enter the hijaz/i })).toHaveAttribute('href', '/game/level-2');
        expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
    });
});
