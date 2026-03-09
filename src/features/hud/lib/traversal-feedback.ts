import type { ChipProps } from '@/shared/ui/Chip';

type ChipTone = NonNullable<ChipProps['tone']>;

const OBJECTIVE_PROXIMITY_THRESHOLD_METERS = 120_000;

export const resolveHadithFeedbackTone = (currentTotal: number, requiredTotal: number): ChipTone => {
    if (currentTotal >= requiredTotal) {
        return 'success';
    }

    if (currentTotal >= requiredTotal * 0.65) {
        return 'warning';
    }

    return 'default';
};

export const resolveTeacherFeedbackTone = (completed: number, required: number): ChipTone => {
    if (completed >= required) {
        return 'success';
    }

    return completed > 0 ? 'accent' : 'default';
};

export const resolveObjectiveFeedbackTone = (hasObjective: boolean, distanceMeters: number): ChipTone => {
    if (!hasObjective) {
        return 'success';
    }

    if (distanceMeters < OBJECTIVE_PROXIMITY_THRESHOLD_METERS) {
        return 'warning';
    }

    return 'accent';
};
