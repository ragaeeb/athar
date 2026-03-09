import type { LevelCompletionContent } from '@/content/levels/types';

export const DEFAULT_LEVEL_COMPLETION_CONTENT: LevelCompletionContent = {
    eyebrow: 'Chapter Complete',
    historicalNoteTitle: 'Historical Note',
    homeActionLabel: 'Return Home',
    nextChapterActionLabel: 'Continue Athar',
    nextChapterTitle: 'Next Chapter',
    reviewActionLabel: 'Review the Journey',
};

export const createLevelCompletionContent = (
    overrides: Partial<LevelCompletionContent> = {},
): LevelCompletionContent => ({
    ...DEFAULT_LEVEL_COMPLETION_CONTENT,
    ...overrides,
});
