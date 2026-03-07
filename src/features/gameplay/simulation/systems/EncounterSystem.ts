import type {
    SimulationEvent,
    SimulationLevelState,
    SimulationPlayerState,
    SimulationState,
} from '@/features/gameplay/simulation/core/SimulationTypes';
import {
    findCollectableTokens,
    findReachedMilestone,
    findTeacherEncounter,
    findTriggeredObstacle,
} from '@/features/gameplay/systems/CollisionSystem';
import {
    OBSTACLE_HIT_COOLDOWN_MS,
    SCATTER_DURATION_MS,
    TOKEN_COLLECTION_RADIUS_METERS,
} from '@/shared/constants/gameplay';
import { generateScatterTokens } from '@/shared/geo';

const collectNearbyTokens = (
    state: SimulationState,
    player: SimulationPlayerState,
    levelState: SimulationLevelState,
): { events: SimulationEvent[]; levelState: SimulationLevelState; player: SimulationPlayerState } => {
    const collectionRadius = TOKEN_COLLECTION_RADIUS_METERS * state.character.tokenRadiusMultiplier;
    const collectableTokens = findCollectableTokens(player.coords, levelState.tokens, collectionRadius);

    if (collectableTokens.length === 0) {
        return {
            events: [],
            levelState,
            player,
        };
    }

    const collectedIds = new Set(collectableTokens.map((token) => token.id));
    const collectedCount = collectableTokens.reduce((sum, token) => sum + token.value, 0);

    return {
        events: collectableTokens.flatMap((token) => [
            { cue: 'collect-token', type: 'audio' as const },
            { tokenId: token.id, type: 'token-collected' as const, value: token.value },
        ]),
        levelState: {
            ...levelState,
            tokens: levelState.tokens.map((token) =>
                collectedIds.has(token.id)
                    ? {
                          ...token,
                          collected: true,
                      }
                    : token,
            ),
        },
        player: {
            ...player,
            hadithTokens: player.hadithTokens + collectedCount,
        },
    };
};

const openTeacherDialogueIfNeeded = (
    state: SimulationState,
    player: SimulationPlayerState,
    levelState: SimulationLevelState,
): { events: SimulationEvent[]; player: SimulationPlayerState } => {
    if (player.dialogueOpen) {
        return { events: [], player };
    }

    const teacher = findTeacherEncounter(player.coords, state.level, levelState.completedTeacherIds);
    if (!teacher) {
        return { events: [], player };
    }

    return {
        events: [
            { cue: 'teacher-encounter', type: 'audio' },
            { teacher, type: 'dialogue-opened' },
        ],
        player: {
            ...player,
            activeTeacher: teacher,
            dialogueOpen: true,
            speed: 0,
        },
    };
};

const completeMilestoneIfReached = (
    state: SimulationState,
    player: SimulationPlayerState,
    levelState: SimulationLevelState,
): { events: SimulationEvent[]; levelState: SimulationLevelState } => {
    const milestone = findReachedMilestone(player.coords, state.level, levelState.completedMilestoneIds);
    if (!milestone || levelState.completedMilestoneIds.includes(milestone.id)) {
        return { events: [], levelState };
    }

    return {
        events: [{ milestoneId: milestone.id, type: 'milestone-completed' }],
        levelState: {
            ...levelState,
            completedMilestoneIds: [...levelState.completedMilestoneIds, milestone.id],
        },
    };
};

const pruneExpiredTokens = (
    player: SimulationPlayerState,
    levelState: SimulationLevelState,
    nowMs: number,
): { levelState: SimulationLevelState; player: SimulationPlayerState } => {
    const nextTokens = levelState.tokens.filter(
        (token) => !token.expiresAt || token.expiresAt > nowMs || token.collected,
    );
    const nextHitTokens = player.hitTokens.filter((token) => !token.expiresAt || token.expiresAt > nowMs);

    return {
        levelState: nextTokens.length === levelState.tokens.length ? levelState : { ...levelState, tokens: nextTokens },
        player:
            nextHitTokens.length === player.hitTokens.length && player.isHit === nextHitTokens.length > 0
                ? player
                : {
                      ...player,
                      hitTokens: nextHitTokens,
                      isHit: nextHitTokens.length > 0,
                  },
    };
};

const applyObstacleEffects = (
    state: SimulationState,
    player: SimulationPlayerState,
    levelState: SimulationLevelState,
): { events: SimulationEvent[]; levelState: SimulationLevelState; player: SimulationPlayerState } => {
    const obstacle = findTriggeredObstacle(player.coords, state.level);
    const canLoseTokens =
        obstacle?.type !== 'sandstorm' &&
        state.nowMs - player.lastHitAt > OBSTACLE_HIT_COOLDOWN_MS &&
        player.hadithTokens > 0;

    if (!canLoseTokens) {
        return { events: [], levelState, player };
    }

    const baseLostCount = Math.max(1, Math.floor(player.hadithTokens / 2));
    const lostCount = Math.max(1, Math.round(baseLostCount * state.character.obstacleDamageMultiplier));
    const scatteredTokens = generateScatterTokens(player.coords, lostCount, state.nowMs + SCATTER_DURATION_MS);

    return {
        events: [
            { cue: 'obstacle-hit', type: 'audio' },
            { cue: 'lose-token', type: 'audio' },
            { lostCount, type: 'player-hit' },
        ],
        levelState: {
            ...levelState,
            tokens: [...levelState.tokens, ...scatteredTokens],
        },
        player: {
            ...player,
            hadithTokens: Math.max(player.hadithTokens - lostCount, 0),
            hitTokens: scatteredTokens,
            isHit: lostCount > 0,
            lastHitAt: state.nowMs,
            tokensLost: player.tokensLost + lostCount,
        },
    };
};

export const applyEncounterSystems = (
    state: SimulationState,
): { events: SimulationEvent[]; levelState: SimulationLevelState; player: SimulationPlayerState } => {
    const pruned = pruneExpiredTokens(state.player, state.levelState, state.nowMs);
    let player = pruned.player;
    let levelState = pruned.levelState;
    const events: SimulationEvent[] = [];

    const collected = collectNearbyTokens(state, player, levelState);
    player = collected.player;
    levelState = collected.levelState;
    events.push(...collected.events);

    const dialogue = openTeacherDialogueIfNeeded(state, player, levelState);
    player = dialogue.player;
    events.push(...dialogue.events);

    const milestone = completeMilestoneIfReached(state, player, levelState);
    levelState = milestone.levelState;
    events.push(...milestone.events);

    const obstacle = applyObstacleEffects(state, player, levelState);
    player = obstacle.player;
    levelState = obstacle.levelState;
    events.push(...obstacle.events);

    return {
        events,
        levelState,
        player,
    };
};
