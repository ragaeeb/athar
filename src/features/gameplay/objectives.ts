import type { LevelConfig, ObjectiveStatus } from '@/content/levels/types';

export const getChapterHadithTotal = (lockedHadith: number, currentHadith: number) => lockedHadith + currentHadith;

export const buildObjectiveStatuses = (
    config: LevelConfig,
    completedTeacherIds: string[],
    completedMilestoneIds: string[],
    chapterHadithTotal: number,
): ObjectiveStatus[] => [
    {
        completed: chapterHadithTotal >= config.winCondition.requiredHadith,
        detail: `${chapterHadithTotal}/${config.winCondition.requiredHadith} gathered`,
        id: `${config.id}-hadith`,
        kind: 'hadith',
        label: `Verify ${config.winCondition.requiredHadith} hadith`,
    },
    ...config.winCondition.requiredTeachers.map((teacherId) => {
        const teacher = config.teachers.find((entry) => entry.id === teacherId);
        return {
            completed: completedTeacherIds.includes(teacherId),
            detail: teacher ? `Meet ${teacher.name} in ${teacher.city}` : 'Teacher encounter',
            id: teacherId,
            kind: 'teacher' as const,
            label: teacher?.name ?? teacherId,
        };
    }),
    {
        completed: completedMilestoneIds.includes(config.winCondition.finalMilestone),
        detail: 'Reach the final milestone to complete the leg.',
        id: config.winCondition.finalMilestone,
        kind: 'milestone',
        label:
            config.milestones.find((milestone) => milestone.id === config.winCondition.finalMilestone)?.label ??
            'Final milestone',
    },
];
