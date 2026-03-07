import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/game/store/game.store';
import { useLevelStore } from '@/game/store/level.store';
import { usePlayerStore } from '@/game/store/player.store';
import { audioManager } from '@/lib/audio';
import { OBSTACLE_HIT_COOLDOWN_MS, SCATTER_DURATION_MS, TOKEN_COLLECTION_RADIUS_METERS } from '@/lib/constants';
import { generateScatterTokens } from '@/lib/geo';

import {
    findCollectableTokens,
    findReachedMilestone,
    findTeacherEncounter,
    findTriggeredObstacle,
    meetsWinCondition,
    resolveNextObjective,
} from './CollisionSystem';

type FrameState = {
    character: ReturnType<typeof useGameStore.getState>['selectedCharacter'];
    levelState: ReturnType<typeof useLevelStore.getState>;
    playerState: ReturnType<typeof usePlayerStore.getState>;
};

const readFrameState = (): FrameState => ({
    character: useGameStore.getState().selectedCharacter,
    levelState: useLevelStore.getState(),
    playerState: usePlayerStore.getState(),
});

const collectNearbyTokens = (frameState: FrameState, collectionRadius: number) => {
    const collectableTokens = findCollectableTokens(
        frameState.playerState.coords,
        frameState.levelState.tokens,
        collectionRadius,
    );

    for (const token of collectableTokens) {
        useLevelStore.getState().collectToken(token.id);
        usePlayerStore.getState().addToken(token.value);
        audioManager.play('collect-token');
    }
};

const openTeacherDialogueIfNeeded = (frameState: FrameState) => {
    if (frameState.playerState.dialogueOpen || !frameState.levelState.config) {
        return;
    }

    const teacher = findTeacherEncounter(
        frameState.playerState.coords,
        frameState.levelState.config,
        frameState.levelState.completedTeacherIds,
    );

    if (!teacher) {
        return;
    }

    usePlayerStore.getState().openDialogue(teacher);
    audioManager.play('teacher-encounter');
};

const completeReachedMilestoneIfNeeded = (frameState: FrameState) => {
    if (!frameState.levelState.config) {
        return;
    }

    const milestone = findReachedMilestone(
        frameState.playerState.coords,
        frameState.levelState.config,
        frameState.levelState.completedMilestoneIds,
    );

    if (milestone) {
        useLevelStore.getState().completeMilestone(milestone.id);
    }
};

const applyObstacleEffectsIfNeeded = (frameState: FrameState, now: number) => {
    if (!frameState.levelState.config) {
        return;
    }

    const obstacle = findTriggeredObstacle(frameState.playerState.coords, frameState.levelState.config);
    const canLoseTokens =
        obstacle?.type !== 'sandstorm' &&
        now - frameState.playerState.lastHitAt > OBSTACLE_HIT_COOLDOWN_MS &&
        frameState.playerState.hadithTokens > 0;

    if (!canLoseTokens) {
        return;
    }

    const lostCount = Math.max(1, Math.floor(frameState.playerState.hadithTokens / 2));
    const scatteredTokens = generateScatterTokens(frameState.playerState.coords, lostCount, now + SCATTER_DURATION_MS);

    usePlayerStore.getState().loseTokens(lostCount, scatteredTokens, now);
    useLevelStore.getState().addScatteredTokens(scatteredTokens);
    audioManager.play('obstacle-hit');
    audioManager.play('lose-token');
};

export const GameLoop = () => {
    useFrame(() => {
        const now = Date.now();
        let frameState = readFrameState();

        if (!frameState.levelState.config || frameState.levelState.isComplete) {
            return;
        }

        frameState.levelState.pruneExpiredTokens(now);
        frameState.playerState.clearExpiredHitTokens(now);
        frameState = readFrameState();

        const collectionRadius = TOKEN_COLLECTION_RADIUS_METERS * (frameState.character === 'abu-dawud' ? 1.35 : 1);
        collectNearbyTokens(frameState, collectionRadius);
        frameState = readFrameState();

        openTeacherDialogueIfNeeded(frameState);
        frameState = readFrameState();

        completeReachedMilestoneIfNeeded(frameState);
        frameState = readFrameState();

        applyObstacleEffectsIfNeeded(frameState, now);
        frameState = readFrameState();
        const config = frameState.levelState.config;
        if (!config) {
            return;
        }

        const nextObjective = resolveNextObjective(
            config,
            frameState.levelState.completedTeacherIds,
            frameState.levelState.completedMilestoneIds,
            frameState.levelState.tokens,
        );
        useLevelStore.getState().setNextObjective(nextObjective);

        if (
            meetsWinCondition(
                config,
                frameState.levelState.completedTeacherIds,
                frameState.levelState.completedMilestoneIds,
                frameState.levelState.lockedHadith,
                frameState.playerState.hadithTokens,
            )
        ) {
            useLevelStore.getState().setComplete(true);
        }
    });

    return null;
};
