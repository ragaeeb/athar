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

export const GameLoop = () => {
    useFrame(() => {
        const now = Date.now();
        let levelState = useLevelStore.getState();
        let playerState = usePlayerStore.getState();
        const refreshState = () => {
            levelState = useLevelStore.getState();
            playerState = usePlayerStore.getState();
        };
        const character = useGameStore.getState().selectedCharacter;

        if (!levelState.config || levelState.isComplete) {
            return;
        }

        levelState.pruneExpiredTokens(now);
        playerState.clearExpiredHitTokens(now);
        refreshState();

        const collectionRadius = TOKEN_COLLECTION_RADIUS_METERS * (character === 'abu-dawud' ? 1.35 : 1);

        const collectableTokens = findCollectableTokens(playerState.coords, levelState.tokens, collectionRadius);
        for (const token of collectableTokens) {
            useLevelStore.getState().collectToken(token.id);
            usePlayerStore.getState().addToken(token.value);
            audioManager.play('collect-token');
        }
        refreshState();

        if (!playerState.dialogueOpen) {
            const teacher = findTeacherEncounter(playerState.coords, levelState.config, levelState.completedTeacherIds);

            if (teacher) {
                usePlayerStore.getState().openDialogue(teacher);
                audioManager.play('teacher-encounter');
                refreshState();
            }
        }

        const milestone = findReachedMilestone(playerState.coords, levelState.config, levelState.completedMilestoneIds);

        if (milestone) {
            useLevelStore.getState().completeMilestone(milestone.id);
            refreshState();
        }

        const obstacle = findTriggeredObstacle(playerState.coords, levelState.config);
        if (obstacle) {
            if (obstacle.type !== 'sandstorm' && now - playerState.lastHitAt > OBSTACLE_HIT_COOLDOWN_MS && playerState.hadithTokens > 0) {
                const lostCount = Math.max(1, Math.floor(playerState.hadithTokens / 2));
                const scatteredTokens = generateScatterTokens(playerState.coords, lostCount, now + SCATTER_DURATION_MS);

                usePlayerStore.getState().loseTokens(lostCount, scatteredTokens, now);
                useLevelStore.getState().addScatteredTokens(scatteredTokens);
                audioManager.play('obstacle-hit');
                audioManager.play('lose-token');
                refreshState();
            }
        }

        const nextObjective = resolveNextObjective(
            levelState.config,
            levelState.completedTeacherIds,
            levelState.completedMilestoneIds,
            levelState.tokens,
        );
        useLevelStore.getState().setNextObjective(nextObjective);

        if (
            meetsWinCondition(
                levelState.config,
                levelState.completedTeacherIds,
                levelState.completedMilestoneIds,
                levelState.lockedHadith,
                playerState.hadithTokens,
            )
        ) {
            useLevelStore.getState().setComplete(true);
        }
    });

    return null;
};
