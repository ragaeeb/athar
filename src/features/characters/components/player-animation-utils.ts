import type { AnimationClip } from 'three';

const animationNameMatches = (name: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(name));

export const filterValidAnimationClips = (animations: AnimationClip[]) =>
    animations.filter((clip) => clip.duration > 0.05 && clip.tracks.length > 0);

export const resolveCharacterAnimationNames = (animationClips: AnimationClip[]) => {
    const animationNames = animationClips.map((clip) => clip.name);
    const fallbackAnimation = animationNames[0] ?? null;
    const locomotionAnimation =
        animationNames.find((name) => animationNameMatches(name, [/walk/i, /run/i, /jog/i, /locomot/i, /mixamo/i])) ??
        fallbackAnimation;
    const idleAnimation = animationNames.find((name) => animationNameMatches(name, [/idle/i, /stand/i])) ?? null;

    return {
        animationNames,
        fallbackAnimation,
        idleAnimation,
        locomotionAnimation,
    };
};
