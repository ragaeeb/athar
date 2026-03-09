import type { LevelConfig, ObjectiveStatus } from '@/content/levels/types';

export const getChapterHadithTotal = (lockedHadith: number, currentHadith: number) => lockedHadith + currentHadith;

const getRequiredTeacher = (config: LevelConfig, teacherId: string) => {
    const teacher = config.teachers.find((entry) => entry.id === teacherId);
    if (!teacher) {
        throw new Error(`Level "${config.id}" references unknown required teacher "${teacherId}"`);
    }

    return teacher;
};

const getFinalMilestone = (config: LevelConfig) => {
    const milestone = config.milestones.find((entry) => entry.id === config.winCondition.finalMilestone);
    if (!milestone) {
        throw new Error(
            `Level "${config.id}" references unknown final milestone "${config.winCondition.finalMilestone}"`,
        );
    }

    return milestone;
};

export const buildObjectiveStatuses = (
    config: LevelConfig,
    completedTeacherIds: string[],
    completedMilestoneIds: string[],
    chapterHadithTotal: number,
): ObjectiveStatus[] => {
    const finalMilestone = getFinalMilestone(config);

    return [
        {
            completed: chapterHadithTotal >= config.winCondition.requiredHadith,
            detail: `${chapterHadithTotal}/${config.winCondition.requiredHadith} gathered`,
            id: `${config.id}-hadith`,
            kind: 'hadith',
            label: `Verify ${config.winCondition.requiredHadith} hadith`,
        },
        ...config.winCondition.requiredTeachers.map((teacherId) => {
            const teacher = getRequiredTeacher(config, teacherId);
            return {
                completed: completedTeacherIds.includes(teacherId),
                detail: `Meet ${teacher.name} in ${teacher.city}`,
                id: teacherId,
                kind: 'teacher' as const,
                label: teacher.name,
            };
        }),
        {
            completed: completedMilestoneIds.includes(config.winCondition.finalMilestone),
            detail: 'Reach the final milestone to complete the leg.',
            id: config.winCondition.finalMilestone,
            kind: 'milestone',
            label: finalMilestone.label,
        },
    ];
};
