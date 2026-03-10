import { describe, expect, it } from 'vitest';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { level1 } from '@/content/levels/level-1/config';
import type { SimulationState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { applyEncounterSystems } from '@/features/gameplay/simulation/systems/EncounterSystem';
import { resolveObstaclePatrolCoords } from '@/features/gameplay/simulation/systems/obstacle-patrol';
import {
    COMPLETED_MILESTONE_SAFE_ZONE_RADIUS_METERS,
    TEACHER_INTERACTION_RADIUS_METERS,
} from '@/shared/constants/gameplay';
import { metersOffsetFromCoords, offsetCoords } from '@/shared/geo';

const createSimulationState = (overrides?: Partial<SimulationState>): SimulationState => ({
    character: {
        guardLossMultiplier: CHARACTER_CONFIGS.bukhari.guardLossMultiplier,
        obstacleDamageMultiplier: CHARACTER_CONFIGS.bukhari.obstacleDamageMultiplier,
        rivalLossMultiplier: CHARACTER_CONFIGS.bukhari.rivalLossMultiplier,
        scrambleDurationMultiplier: CHARACTER_CONFIGS.bukhari.scrambleDurationMultiplier,
        speedMultiplier: CHARACTER_CONFIGS.bukhari.speedMultiplier,
        tokenRadiusMultiplier: CHARACTER_CONFIGS.bukhari.tokenRadiusMultiplier,
    },
    level: level1,
    levelState: {
        completedMilestoneIds: [],
        completedTeacherIds: [],
        isComplete: false,
        lockedHadith: 0,
        nextObjective: null,
        objectives: [],
        tokens: [],
        ...overrides?.levelState,
    },
    nowMs: 10_000,
    player: {
        activeTeacher: null,
        bearing: 0,
        coords: level1.origin,
        dialogueOpen: false,
        hadithTokens: 0,
        hitTokens: [],
        isHit: false,
        lastHitAt: 0,
        positionMeters: metersOffsetFromCoords(level1.origin, level1.origin),
        scrambleUntil: 0,
        speed: 0,
        tokensLost: 0,
        ...overrides?.player,
    },
    ...overrides,
});

describe('EncounterSystem', () => {
    it('does not apply obstacle token loss when no obstacle is nearby', () => {
        const state = createSimulationState({
            player: {
                ...createSimulationState().player,
                coords: level1.origin,
                hadithTokens: 4,
            },
        });

        const result = applyEncounterSystems(state);

        expect(result.events.some((event) => event.type === 'player-hit')).toBe(false);
        expect(result.player.hadithTokens).toBe(4);
        expect(result.player.tokensLost).toBe(0);
    });

    it('caps obstacle token loss to the number of tokens the player has', () => {
        const originalObstacle = level1.obstacles[0];
        if (!originalObstacle) {
            throw new Error('Level 1 must include at least one obstacle for this test.');
        }
        const obstacle = {
            ...originalObstacle,
            coords: { lat: 38.4, lng: 62.5 },
        };

        const baseState = createSimulationState();
        const result = applyEncounterSystems({
            ...baseState,
            character: {
                ...baseState.character,
                obstacleDamageMultiplier: 5,
            },
            level: {
                ...level1,
                obstacles: [obstacle],
            },
            player: {
                ...baseState.player,
                coords: obstacle.coords,
                hadithTokens: 1,
                positionMeters: metersOffsetFromCoords(obstacle.coords, level1.origin),
            },
        });

        expect(result.events).toContainEqual({ lostCount: 1, type: 'player-hit' });
        expect(result.player.hadithTokens).toBe(0);
        expect(result.player.tokensLost).toBe(1);
        expect(result.levelState.tokens).toHaveLength(1);
    });

    it('applies flood scramble and recoverable loss instead of generic confiscation', () => {
        const flood = {
            coords: { lat: 38.4, lng: 62.5 },
            id: 'wadi-flood',
            label: 'Wadi Flood',
            radius: 60_000,
            type: 'flood' as const,
        };
        const baseState = createSimulationState();
        const result = applyEncounterSystems({
            ...baseState,
            level: {
                ...level1,
                obstacles: [flood],
            },
            player: {
                ...baseState.player,
                coords: flood.coords,
                hadithTokens: 8,
                positionMeters: metersOffsetFromCoords(flood.coords, level1.origin),
            },
        });

        expect(result.events).toContainEqual(
            expect.objectContaining({
                effect: 'wash',
                obstacleId: flood.id,
                obstacleType: flood.type,
                type: 'hazard-triggered',
            }),
        );
        expect(result.player.scrambleUntil).toBeGreaterThan(baseState.nowMs);
        expect(result.levelState.tokens.some((token) => token.kind === 'scattered')).toBe(true);
        expect(result.player.hadithTokens).toBeLessThan(8);
    });

    it('emits a defeat event when a scorpion attack connects', () => {
        const scorpion = {
            coords: { lat: 38.4, lng: 62.5 },
            id: 'scorpion-ambush',
            label: 'Scorpion Ambush',
            radius: 40_000,
            type: 'scorpion' as const,
        };
        const baseState = createSimulationState();
        const result = applyEncounterSystems({
            ...baseState,
            level: {
                ...level1,
                obstacles: [scorpion],
            },
            player: {
                ...baseState.player,
                coords: scorpion.coords,
                hadithTokens: 6,
                positionMeters: metersOffsetFromCoords(scorpion.coords, level1.origin),
            },
        });

        expect(result.events).toContainEqual(
            expect.objectContaining({
                effect: 'kill',
                obstacleId: scorpion.id,
                obstacleType: scorpion.type,
                type: 'hazard-triggered',
            }),
        );
        expect(result.events).toContainEqual({
            obstacleId: scorpion.id,
            obstacleLabel: scorpion.label,
            obstacleType: scorpion.type,
            type: 'player-defeated',
        });
        expect(result.player.hadithTokens).toBe(0);
        expect(result.player.speed).toBe(0);
    });

    it('does not retrigger obstacle token loss while standing inside a completed milestone safe zone', () => {
        const mervMilestone = level1.milestones.find((milestone) => milestone.id === 'merv-crossing');
        if (!mervMilestone) {
            throw new Error('Level 1 must include Merv Crossing for this test.');
        }

        const baseState = createSimulationState();
        const result = applyEncounterSystems({
            ...baseState,
            levelState: {
                ...baseState.levelState,
                completedMilestoneIds: ['merv-crossing'],
            },
            player: {
                ...baseState.player,
                coords: mervMilestone.coords,
                hadithTokens: 8,
                positionMeters: metersOffsetFromCoords(mervMilestone.coords, level1.origin),
            },
        });

        expect(result.events.some((event) => event.type === 'player-hit')).toBe(false);
        expect(result.player.hadithTokens).toBe(8);
        expect(result.player.tokensLost).toBe(0);
    });

    it('still triggers a nearby hazard once the player leaves the smaller completed milestone safe zone', () => {
        const milestoneCoords = { lat: 24.33, lng: 39.55 };
        const hazardCoords = offsetCoords(milestoneCoords, {
            x: COMPLETED_MILESTONE_SAFE_ZONE_RADIUS_METERS + 6_000,
            z: 0,
        });
        const nearHazard = {
            coords: hazardCoords,
            id: 'guard-near-finished-milestone',
            label: 'Corrupt Guard',
            radius: 20_000,
            type: 'guard' as const,
        };
        const levelWithNearbyHazard = {
            ...level1,
            milestones: [
                {
                    ...level1.milestones[0]!,
                    coords: milestoneCoords,
                    id: 'safe-zone-milestone',
                },
            ],
            obstacles: [nearHazard],
        };
        const baseState = createSimulationState({
            level: levelWithNearbyHazard,
        });

        const result = applyEncounterSystems({
            ...baseState,
            levelState: {
                ...baseState.levelState,
                completedMilestoneIds: ['safe-zone-milestone'],
            },
            player: {
                ...baseState.player,
                coords: hazardCoords,
                hadithTokens: 8,
                positionMeters: metersOffsetFromCoords(hazardCoords, levelWithNearbyHazard.origin),
            },
        });

        expect(result.events.some((event) => event.type === 'player-hit')).toBe(true);
        expect(result.player.hadithTokens).toBeLessThan(8);
    });

    it('uses the patrolling obstacle center instead of the authored anchor for encounter checks', () => {
        const guard = {
            coords: { lat: 24.14, lng: 39.32 },
            id: 'guard-patrol-test',
            label: 'Corrupt Guard',
            patrolRadius: 48_000,
            radius: 18_000,
            type: 'guard' as const,
        };
        const patrolLevel = {
            ...level1,
            hadithTokenClusters: [],
            milestones: [],
            namedAreas: [],
            obstacles: [guard],
            origin: guard.coords,
            teachers: [],
        };
        const baseState = createSimulationState({
            level: patrolLevel,
            nowMs: 8_000,
        });
        const patrolCoords = resolveObstaclePatrolCoords(guard, baseState.nowMs);

        const anchoredResult = applyEncounterSystems({
            ...baseState,
            player: {
                ...baseState.player,
                coords: guard.coords,
                hadithTokens: 8,
                positionMeters: metersOffsetFromCoords(guard.coords, patrolLevel.origin),
            },
        });
        const patrollingResult = applyEncounterSystems({
            ...baseState,
            player: {
                ...baseState.player,
                coords: patrolCoords,
                hadithTokens: 8,
                positionMeters: metersOffsetFromCoords(patrolCoords, patrolLevel.origin),
            },
        });

        expect(anchoredResult.events.some((event) => event.type === 'player-hit')).toBe(false);
        expect(patrollingResult.events.some((event) => event.type === 'player-hit')).toBe(true);
    });

    it('requires the player to be closer before a teacher encounter opens', () => {
        const teacher = level1.teachers[0];
        if (!teacher) {
            throw new Error('Level 1 must include at least one teacher for this test.');
        }

        const justOutsideRange = offsetCoords(teacher.coords, {
            x: TEACHER_INTERACTION_RADIUS_METERS + 5_000,
            z: 0,
        });
        const justInsideRange = offsetCoords(teacher.coords, {
            x: TEACHER_INTERACTION_RADIUS_METERS - 5_000,
            z: 0,
        });

        const outsideBaseState = createSimulationState();
        const outsideResult = applyEncounterSystems({
            ...outsideBaseState,
            player: {
                ...outsideBaseState.player,
                coords: justOutsideRange,
                positionMeters: metersOffsetFromCoords(justOutsideRange, level1.origin),
            },
        });

        const insideBaseState = createSimulationState();
        const insideResult = applyEncounterSystems({
            ...insideBaseState,
            player: {
                ...insideBaseState.player,
                coords: justInsideRange,
                positionMeters: metersOffsetFromCoords(justInsideRange, level1.origin),
            },
        });

        expect(outsideResult.events.some((event) => event.type === 'dialogue-opened')).toBe(false);
        expect(insideResult.events.some((event) => event.type === 'dialogue-opened')).toBe(true);
        // Teacher encounter audio is emitted only when dialogue is confirmed by the loop transition, not on open events.
        expect(insideResult.events.some((event) => event.type === 'audio' && event.cue === 'teacher-encounter')).toBe(
            false,
        );
    });
});
