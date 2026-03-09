import type { AnimationAction, AnimationClip } from 'three';
import { LoopRepeat } from 'three';

const animationNameMatches = (name: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(name));

export const filterValidAnimationClips = (animations: AnimationClip[]) =>
    animations.filter((clip) => clip.duration > 0.05 && clip.tracks.length > 0);

export const resolveCharacterAnimationNames = (animationClips: AnimationClip[]) => {
    const animationNames = animationClips.map((clip) => clip.name);
    const fallbackAnimation = animationNames[0] ?? null;
    const locomotionAnimation =
        animationNames.find(
            (name) =>
                animationNameMatches(name, [/walk/i, /run/i, /jog/i, /locomot/i]) ||
                (/mixamo/i.test(name) && /walk|run|jog|locomot/i.test(name)),
        ) ?? fallbackAnimation;
    const idleAnimation =
        animationNames.find((name) => animationNameMatches(name, [/idle/i, /stand/i])) ?? fallbackAnimation;

    return {
        animationNames,
        fallbackAnimation,
        idleAnimation,
        locomotionAnimation,
    };
};

export const resolveActiveCharacterAnimationName = ({
    idleAnimation,
    locomotionAnimation,
    speed,
}: {
    idleAnimation: string | null;
    locomotionAnimation: string | null;
    speed: number;
}) => (speed > 0 ? locomotionAnimation : idleAnimation);

export const syncCharacterAnimationState = ({
    actions,
    nextAnimationName,
    previousAnimationName,
}: {
    actions: Record<string, AnimationAction | null | undefined>;
    nextAnimationName: string | null;
    previousAnimationName: string | null;
}) => {
    if (nextAnimationName === previousAnimationName) {
        return previousAnimationName;
    }

    if (previousAnimationName) {
        actions[previousAnimationName]?.fadeOut(0.2);
    } else {
        for (const action of Object.values(actions)) {
            action?.stop();
        }
    }

    if (!nextAnimationName) {
        return null;
    }

    const activeAction = actions[nextAnimationName];
    if (!activeAction) {
        return previousAnimationName;
    }

    activeAction.reset();
    activeAction.setLoop(LoopRepeat, Infinity);
    activeAction.setEffectiveTimeScale(1);
    activeAction.fadeIn(0.2).play();
    return nextAnimationName;
};
