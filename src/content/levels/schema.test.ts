import { describe, expect, it } from 'vitest';

import { level1 } from '@/content/levels/level-1/config';
import { levelConfigSchema } from '@/content/levels/schema';

describe('levelConfigSchema', () => {
    it('rejects duplicate teacher ids', () => {
        const result = levelConfigSchema.safeParse({
            ...level1,
            teachers: [...level1.teachers, { ...level1.teachers[0], city: 'Duplicate City' }],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some((issue) => issue.message.includes('Duplicate teacher id'))).toBe(true);
        }
    });

    it('rejects duplicate milestone ids and duplicate required teachers', () => {
        const duplicateMilestoneId = level1.milestones[0]?.id ?? 'start';
        const duplicateTeacherId = level1.winCondition.requiredTeachers[0] ?? 'teacher';
        const result = levelConfigSchema.safeParse({
            ...level1,
            milestones: [...level1.milestones, { ...level1.milestones[0], label: 'Duplicate milestone' }],
            winCondition: {
                ...level1.winCondition,
                requiredTeachers: [...level1.winCondition.requiredTeachers, duplicateTeacherId],
            },
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(
                result.error.issues.some((issue) =>
                    issue.message.includes(`Duplicate milestone id "${duplicateMilestoneId}"`),
                ),
            ).toBe(true);
            expect(
                result.error.issues.some((issue) =>
                    issue.message.includes(`Duplicate required teacher "${duplicateTeacherId}"`),
                ),
            ).toBe(true);
        }
    });

    it('rejects non-ambient audio cues for ambientCue', () => {
        const result = levelConfigSchema.safeParse({
            ...level1,
            ambientCue: 'collect-token',
        });

        expect(result.success).toBe(false);
    });
});
