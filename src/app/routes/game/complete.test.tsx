import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LevelCompleteRoute } from '@/app/routes/game/complete';
import { level3 } from '@/content/levels/level-3/config';
import { level5 } from '@/content/levels/level-5/config';
import { resetGameStore, useGameStore } from '@/features/gameplay/state/game.store';

describe('LevelCompleteRoute', () => {
    beforeEach(() => {
        resetGameStore();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders a chapter-specific completion summary and surfaces the next playable chapter CTA', () => {
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
        expect(screen.getByRole('link', { name: /enter iraq/i })).toHaveAttribute('href', '/game/level-3');
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

    it('renders the next playable chapter CTA after level four completion', () => {
        useGameStore.setState({
            currentLevel: 5,
            lastCompletion: {
                completionNarration: 'Eastern route completion narration.',
                historicalNote: 'Eastern route historical note.',
                levelId: 'level-4',
                levelName: 'Level 4',
                levelSubtitle: 'Persia and the East: Ray, Nishapur, Merv',
                teachersMet: 1,
                timeTakenSeconds: 133,
                tokensLost: 9,
                verifiedHadith: 52,
            },
            legacyVerifiedHadithBalance: 0,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 118,
            unlockedLevels: [1, 2, 3, 4, 5],
            verifiedHadithByLevel: { 'level-4': 52 },
        });

        render(
            <MemoryRouter>
                <LevelCompleteRoute />
            </MemoryRouter>,
        );

        expect(screen.getByText(/Eastern Route Complete/i)).toBeInTheDocument();
        expect(screen.getByText(/Next Journey: The Final Compilation/i)).toBeInTheDocument();
        expect(screen.getByText(level5.teaser)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /begin the finale/i })).toHaveAttribute('href', '/game/level-5');
        expect(screen.queryByText(/All Chapters Complete/i)).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
    });

    it('keeps next-chapter teaser visible when unlock state is stale but does not show the CTA', () => {
        useGameStore.setState({
            currentLevel: 4,
            lastCompletion: {
                completionNarration: 'Eastern route completion narration.',
                historicalNote: 'Eastern route historical note.',
                levelId: 'level-4',
                levelName: 'Level 4',
                levelSubtitle: 'Persia and the East: Ray, Nishapur, Merv',
                teachersMet: 1,
                timeTakenSeconds: 133,
                tokensLost: 9,
                verifiedHadith: 52,
            },
            legacyVerifiedHadithBalance: 0,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 118,
            unlockedLevels: [1, 2, 3, 4],
            verifiedHadithByLevel: { 'level-4': 52 },
        });

        render(
            <MemoryRouter>
                <LevelCompleteRoute />
            </MemoryRouter>,
        );

        expect(screen.getByText(level5.teaser)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /begin the finale/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/All Chapters Complete/i)).not.toBeInTheDocument();
    });

    it('renders a terminal legacy panel after the final chapter completes', () => {
        useGameStore.setState({
            currentLevel: 5,
            lastCompletion: {
                completionNarration: 'Final compilation narration.',
                historicalNote: 'Final legacy note.',
                levelId: 'level-5',
                levelName: 'Level 5',
                levelSubtitle: 'The Grand Finale: Syria, Egypt, and the Compilation',
                teachersMet: 2,
                timeTakenSeconds: 188,
                tokensLost: 11,
                verifiedHadith: 60,
            },
            legacyVerifiedHadithBalance: 0,
            selectedCharacter: 'bukhari',
            totalHadithVerified: 178,
            unlockedLevels: [1, 2, 3, 4, 5],
            verifiedHadithByLevel: {
                'level-1': 30,
                'level-2': 36,
                'level-3': 48,
                'level-4': 52,
                'level-5': 60,
            },
        });

        render(
            <MemoryRouter>
                <LevelCompleteRoute />
            </MemoryRouter>,
        );

        expect(screen.getByText(/Journey Complete/i)).toBeInTheDocument();
        expect(screen.getByText(/Legacy of the Journey/i)).toBeInTheDocument();
        expect(screen.getByText(/All Chapters Complete/i)).toBeInTheDocument();
        const legacySummaryPanel = screen.getByTestId('legacy-summary-panel');
        expect(within(legacySummaryPanel).getByText('178')).toBeInTheDocument();
        expect(within(legacySummaryPanel).getByText('5')).toBeInTheDocument();
        expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /continue athar/i })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
    });
});
