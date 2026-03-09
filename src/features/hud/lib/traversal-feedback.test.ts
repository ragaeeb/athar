import { describe, expect, it } from 'vitest';

import {
    resolveHadithFeedbackTone,
    resolveObjectiveFeedbackTone,
    resolveTeacherFeedbackTone,
} from '@/features/hud/lib/traversal-feedback';

describe('traversal-feedback', () => {
    it('marks hadith feedback as success once the chapter target is met', () => {
        expect(resolveHadithFeedbackTone(30, 30)).toBe('success');
        expect(resolveHadithFeedbackTone(21, 30)).toBe('warning');
        expect(resolveHadithFeedbackTone(10, 30)).toBe('default');
    });

    it('marks teacher feedback based on route progress', () => {
        expect(resolveTeacherFeedbackTone(0, 3)).toBe('default');
        expect(resolveTeacherFeedbackTone(1, 3)).toBe('accent');
        expect(resolveTeacherFeedbackTone(3, 3)).toBe('success');
    });

    it('marks objectives as urgent when the player is close', () => {
        expect(resolveObjectiveFeedbackTone(false, 0)).toBe('success');
        expect(resolveObjectiveFeedbackTone(true, 80_000)).toBe('warning');
        expect(resolveObjectiveFeedbackTone(true, 200_000)).toBe('accent');
    });
});
