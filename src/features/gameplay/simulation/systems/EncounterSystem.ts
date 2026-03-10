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
    isWithinCompletedMilestoneSafeZone,
} from '@/features/gameplay/simulation/systems/CollisionSystem';
import {
    isObstacleHitOnCooldown,
    resolveObstacleEncounterEffect,
} from '@/features/gameplay/simulation/systems/obstacle-rules';
import { SCATTER_DURATION_MS, TOKEN_COLLECTION_RADIUS_METERS } from '@/shared/constants/gameplay';
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
        events: [{ teacher, type: 'dialogue-opened' }],
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
    if (isObstacleHitOnCooldown(player.lastHitAt, state.nowMs)) {
        return { events: [], levelState, player };
    }

    const obstacle = findTriggeredObstacle(player.coords, state.level, state.nowMs);
    if (!obstacle || isWithinCompletedMilestoneSafeZone(player.coords, state.level, levelState.completedMilestoneIds)) {
        return { events: [], levelState, player };
    }

    const effect = resolveObstacleEncounterEffect({
        character: state.character,
        hadithTokens: player.hadithTokens,
        obstacle,
    });

    if (!effect) {
        return { events: [], levelState, player };
    }

    const scatteredTokens =
        effect.recoverableCount > 0
            ? generateScatterTokens(player.coords, effect.recoverableCount, state.nowMs + SCATTER_DURATION_MS)
            : [];
    const nextScrambleUntil = Math.max(player.scrambleUntil, state.nowMs + effect.scrambleDurationMs);
    const defeatEvent =
        effect.effect === 'kill'
            ? ([
                  {
                      obstacleId: obstacle.id,
                      obstacleLabel: obstacle.label,
                      obstacleType: obstacle.type,
                      type: 'player-defeated' as const,
                  },
              ] as const)
            : [];

    return {
        events: [
            { cue: 'obstacle-hit', type: 'audio' },
            ...(effect.lostCount > 0 ? ([{ cue: 'lose-token', type: 'audio' as const }] as const) : []),
            ...(effect.lostCount > 0 ? ([{ lostCount: effect.lostCount, type: 'player-hit' as const }] as const) : []),
            {
                effect: effect.effect,
                lostCount: effect.lostCount,
                obstacleId: obstacle.id,
                obstacleLabel: obstacle.label,
                obstacleType: obstacle.type,
                recoverableCount: effect.recoverableCount,
                scrambleDurationMs: effect.scrambleDurationMs,
                type: 'hazard-triggered' as const,
            },
            ...defeatEvent,
        ],
        levelState: {
            ...levelState,
            tokens: [...levelState.tokens, ...scatteredTokens],
        },
        player: {
            ...player,
            hadithTokens: Math.max(player.hadithTokens - effect.lostCount, 0),
            hitTokens: scatteredTokens,
            isHit: scatteredTokens.length > 0,
            lastHitAt: state.nowMs,
            scrambleUntil: nextScrambleUntil,
            speed: 0,
            tokensLost: player.tokensLost + effect.lostCount,
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
    for (const event of collected.events) {
        events.push(event);
    }

    const dialogue = openTeacherDialogueIfNeeded(state, player, levelState);
    player = dialogue.player;
    for (const event of dialogue.events) {
        events.push(event);
    }

    const milestone = completeMilestoneIfReached(state, player, levelState);
    levelState = milestone.levelState;
    for (const event of milestone.events) {
        events.push(event);
    }

    const obstacle = applyObstacleEffects(state, player, levelState);
    player = obstacle.player;
    levelState = obstacle.levelState;
    for (const event of obstacle.events) {
        events.push(event);
    }

    return {
        events,
        levelState,
        player,
    };
};
