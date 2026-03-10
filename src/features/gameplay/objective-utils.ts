import type { NextObjective } from '@/content/levels/types';

export const nextObjectivesMatch = (left: NextObjective, right: NextObjective) => {
    if (left === right) {
        return true;
    }

    if (!left || !right) {
        return left === right;
    }

    if (left.id !== right.id) {
        return false;
    }

    if ('density' in left && 'density' in right) {
        return left.density === right.density;
    }

    if ('buildingType' in left || 'buildingType' in right) {
        return 'buildingType' in left && 'buildingType' in right;
    }

    if ('hadith' in left || 'hadith' in right) {
        return 'hadith' in left && 'hadith' in right;
    }

    return true;
};
