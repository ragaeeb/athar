import type { AnimationClip } from 'three';
import { describe, expect, it } from 'vitest';

import {
    filterValidAnimationClips,
    resolveCharacterAnimationNames,
} from '@/features/characters/components/player-animation-utils';

const createClip = ({ duration, name, trackCount }: { duration: number; name: string; trackCount: number }) =>
    ({
        duration,
        name,
        tracks: Array.from({ length: trackCount }, () => ({})),
    }) as unknown as AnimationClip;

describe('player-animation-utils', () => {
    it('filters out zero-length and trackless clips', () => {
        const animations = [
            createClip({ duration: 0.02, name: 'tiny', trackCount: 4 }),
            createClip({ duration: 1, name: 'trackless', trackCount: 0 }),
            createClip({ duration: 1, name: 'Walk Forward', trackCount: 12 }),
        ];

        expect(filterValidAnimationClips(animations).map((clip) => clip.name)).toEqual(['Walk Forward']);
    });

    it('prefers locomotion and idle names when they exist', () => {
        const animations = [
            createClip({ duration: 1, name: 'Idle Pose', trackCount: 8 }),
            createClip({ duration: 1, name: 'Walk Forward', trackCount: 12 }),
            createClip({ duration: 1, name: 'Wave', trackCount: 10 }),
        ];

        expect(resolveCharacterAnimationNames(animations)).toEqual({
            animationNames: ['Idle Pose', 'Walk Forward', 'Wave'],
            fallbackAnimation: 'Idle Pose',
            idleAnimation: 'Idle Pose',
            locomotionAnimation: 'Walk Forward',
        });
    });

    it('falls back to the first valid animation when no locomotion clip matches', () => {
        const animations = [
            createClip({ duration: 1, name: 'Take 001', trackCount: 12 }),
            createClip({ duration: 1, name: 'Stand', trackCount: 9 }),
        ];

        expect(resolveCharacterAnimationNames(animations)).toEqual({
            animationNames: ['Take 001', 'Stand'],
            fallbackAnimation: 'Take 001',
            idleAnimation: 'Stand',
            locomotionAnimation: 'Take 001',
        });
    });
});
