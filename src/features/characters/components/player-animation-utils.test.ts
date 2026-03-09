import { type AnimationAction, type AnimationClip, LoopRepeat } from 'three';
import { describe, expect, it, vi } from 'vitest';

import {
    filterValidAnimationClips,
    resolveActiveCharacterAnimationName,
    resolveCharacterAnimationNames,
    syncCharacterAnimationState,
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

    it('does not treat bare mixamo clip names as locomotion and falls back idle to the first valid clip', () => {
        const animations = [
            createClip({ duration: 1, name: 'Mixamo.com', trackCount: 12 }),
            createClip({ duration: 1, name: 'Gesture', trackCount: 9 }),
        ];

        expect(resolveCharacterAnimationNames(animations)).toEqual({
            animationNames: ['Mixamo.com', 'Gesture'],
            fallbackAnimation: 'Mixamo.com',
            idleAnimation: 'Mixamo.com',
            locomotionAnimation: 'Mixamo.com',
        });
    });

    it('resolves the active animation name from runtime speed without React state', () => {
        expect(
            resolveActiveCharacterAnimationName({
                idleAnimation: 'Idle Pose',
                locomotionAnimation: 'Walk Forward',
                speed: 0,
            }),
        ).toBe('Idle Pose');

        expect(
            resolveActiveCharacterAnimationName({
                idleAnimation: 'Idle Pose',
                locomotionAnimation: 'Walk Forward',
                speed: 12,
            }),
        ).toBe('Walk Forward');
    });

    it('switches animation actions imperatively only when the target animation changes', () => {
        const idleAction = {
            fadeIn: vi.fn().mockReturnThis(),
            fadeOut: vi.fn().mockReturnThis(),
            play: vi.fn().mockReturnThis(),
            reset: vi.fn().mockReturnThis(),
            setEffectiveTimeScale: vi.fn().mockReturnThis(),
            setLoop: vi.fn().mockReturnThis(),
            stop: vi.fn().mockReturnThis(),
        };
        const walkAction = {
            fadeIn: vi.fn().mockReturnThis(),
            fadeOut: vi.fn().mockReturnThis(),
            play: vi.fn().mockReturnThis(),
            reset: vi.fn().mockReturnThis(),
            setEffectiveTimeScale: vi.fn().mockReturnThis(),
            setLoop: vi.fn().mockReturnThis(),
            stop: vi.fn().mockReturnThis(),
        };
        const actions = {
            'Idle Pose': idleAction,
            'Walk Forward': walkAction,
        } as unknown as Record<string, AnimationAction | null | undefined>;

        expect(
            syncCharacterAnimationState({
                actions,
                nextAnimationName: 'Walk Forward',
                previousAnimationName: null,
            }),
        ).toBe('Walk Forward');

        expect(walkAction.reset).toHaveBeenCalledTimes(1);
        expect(walkAction.setLoop).toHaveBeenCalledWith(LoopRepeat, Infinity);
        expect(walkAction.fadeIn).toHaveBeenCalledTimes(1);
        expect(walkAction.play).toHaveBeenCalledTimes(1);

        expect(
            syncCharacterAnimationState({
                actions,
                nextAnimationName: 'Walk Forward',
                previousAnimationName: 'Walk Forward',
            }),
        ).toBe('Walk Forward');

        expect(walkAction.reset).toHaveBeenCalledTimes(1);

        expect(
            syncCharacterAnimationState({
                actions,
                nextAnimationName: 'Idle Pose',
                previousAnimationName: 'Walk Forward',
            }),
        ).toBe('Idle Pose');

        expect(walkAction.fadeOut).toHaveBeenCalledTimes(1);
        expect(idleAction.reset).toHaveBeenCalledTimes(1);
        expect(idleAction.setLoop).toHaveBeenCalledWith(LoopRepeat, Infinity);
        expect(idleAction.fadeIn).toHaveBeenCalledTimes(1);
        expect(idleAction.play).toHaveBeenCalledTimes(1);
    });
});
