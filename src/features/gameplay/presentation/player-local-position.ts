import type { MeterOffset } from '@/content/levels/types';

// The player marker is mounted inside a <Coordinates> scene anchored at the
// chapter origin, so its hot-path local transform can stay in origin-relative
// meter space instead of reprojecting geographic coords every frame.
export const positionMetersToPlayerLocalPosition = ({ x, z }: MeterOffset) => [x, 0, -z] as const;
