import { describe, expect, it } from 'vitest';
import { level1 } from '@/content/levels/level-1/config';
import { shouldPlayTeacherEncounterAudio } from '@/features/gameplay/systems/game-loop-audio';

describe('GameLoop teacher encounter audio', () => {
    const teacher = level1.teachers[0];

    if (!teacher) {
        throw new Error('Level 1 must include at least one teacher for this test.');
    }

    it('plays only when dialogue opens for a teacher', () => {
        expect(
            shouldPlayTeacherEncounterAudio(
                { activeTeacher: null, dialogueOpen: false },
                { activeTeacher: teacher, dialogueOpen: true },
            ),
        ).toBe(true);
    });

    it('does not replay while dialogue is already open', () => {
        expect(
            shouldPlayTeacherEncounterAudio(
                { activeTeacher: teacher, dialogueOpen: true },
                { activeTeacher: teacher, dialogueOpen: true },
            ),
        ).toBe(false);
    });

    it('plays when the same teacher remains active but dialogue opens this frame', () => {
        expect(
            shouldPlayTeacherEncounterAudio(
                { activeTeacher: teacher, dialogueOpen: false },
                { activeTeacher: teacher, dialogueOpen: true },
            ),
        ).toBe(true);
    });

    it('does not play before dialogue officially opens', () => {
        expect(
            shouldPlayTeacherEncounterAudio(
                { activeTeacher: null, dialogueOpen: false },
                { activeTeacher: teacher, dialogueOpen: false },
            ),
        ).toBe(false);
    });
});
