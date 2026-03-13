import { describe, expect, it } from 'vitest';
import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import type { LevelConfig, ObstacleConfig } from '@/content/levels/types';
import type { SimulationState } from '@/features/gameplay/simulation/core/SimulationTypes';
import { resolveObstacleDiagnostic } from '@/features/gameplay/systems/game-loop-obstacle-diagnostics';

const createObstacle = (overrides?: Partial<ObstacleConfig>): ObstacleConfig => ({
    coords: { lat: 0, lng: 0 },
    id: 'viper-test',
    label: 'Desert Viper',
    radius: 55_000,
    type: 'viper',
    ...overrides,
});

const createLevel = (obstacle: ObstacleConfig): LevelConfig => ({
    ambientCue: 'ambient-desert',
    completionContent: {
        eyebrow: 'Done',
        historicalNoteTitle: 'Route Note',
        homeActionLabel: 'Home',
        nextChapterActionLabel: 'Next',
        nextChapterTitle: 'Next Route',
        reviewActionLabel: 'Review',
    },
    completionNarration: 'Complete',
    hadithTokenClusters: [],
    historicalNote: 'Note',
    id: 'diagnostic-level',
    initialView: {
        bearing: 0,
        latitude: 0,
        longitude: 0,
        pitch: 0,
        zoom: 5,
    },
    lighting: {
        hour: 12,
        label: 'Noon',
        minute: 0,
    },
    mapStyle: 'blank',
    milestones: [],
    name: 'Diagnostic Level',
    namedAreas: [],
    narrative: 'Narrative',
    obstacles: [obstacle],
    order: 1,
    origin: { lat: 0, lng: 0 },
    playable: true,
    subtitle: 'Diagnostic',
    teachers: [],
    teaser: 'Diagnostic',
    winCondition: {
        finalMilestone: 'done',
        requiredHadith: 1,
        requiredTeachers: [],
    },
});

const createState = ({
    completedMilestoneIds = [],
    hadithTokens = 0,
    lastHitAt = -10_000,
    nowMs = 10_000,
    obstacle = createObstacle(),
    playerCoords = { lat: 0, lng: 0 },
}: {
    completedMilestoneIds?: string[];
    hadithTokens?: number;
    lastHitAt?: number;
    nowMs?: number;
    obstacle?: ObstacleConfig;
    playerCoords?: { lat: number; lng: number };
} = {}): SimulationState => ({
    character: {
        guardLossMultiplier: CHARACTER_CONFIGS.bukhari.guardLossMultiplier,
        obstacleDamageMultiplier: CHARACTER_CONFIGS.bukhari.obstacleDamageMultiplier,
        rivalLossMultiplier: CHARACTER_CONFIGS.bukhari.rivalLossMultiplier,
        scrambleDurationMultiplier: CHARACTER_CONFIGS.bukhari.scrambleDurationMultiplier,
        speedMultiplier: CHARACTER_CONFIGS.bukhari.speedMultiplier,
        tokenRadiusMultiplier: CHARACTER_CONFIGS.bukhari.tokenRadiusMultiplier,
    },
    level: createLevel(obstacle),
    levelState: {
        completedMilestoneIds,
        completedTeacherIds: [],
        isComplete: false,
        lockedHadith: 0,
        nextObjective: null,
        objectives: [],
        tokens: [],
    },
    nowMs,
    player: {
        activeTeacher: null,
        bearing: 0,
        coords: playerCoords,
        dialogueOpen: false,
        hadithTokens,
        hitTokens: [],
        isHit: false,
        isRunning: false,
        lastHitAt,
        positionMeters: { x: 0, z: 0 },
        runChargeMs: 2_500,
        scrambleUntil: 0,
        speed: 0,
        tokensLost: 0,
    },
});

describe('resolveObstacleDiagnostic', () => {
    it('reports empty-carry suppression inside the trigger radius', () => {
        const diagnostic = resolveObstacleDiagnostic(createState());

        expect(diagnostic?.eventName).toBe('OBSTACLE_SUPPRESSED_EMPTY_CARRY');
        expect(diagnostic?.suppressionReason).toBe('empty-carry');
        expect(diagnostic?.withinTriggerRadius).toBe(true);
    });

    it('reports when a hazard will trigger once the player is carrying hadith', () => {
        const diagnostic = resolveObstacleDiagnostic(
            createState({
                hadithTokens: 8,
            }),
        );

        expect(diagnostic?.eventName).toBe('OBSTACLE_WILL_TRIGGER');
        expect(diagnostic?.effect).toBe('scatter');
        expect(diagnostic?.suppressionReason).toBe('will-trigger');
    });

    it('reports safe-zone suppression separately from empty carry', () => {
        const milestoneId = 'safe-haven';
        const diagnostic = resolveObstacleDiagnostic({
            ...createState({
                hadithTokens: 8,
                obstacle: createObstacle(),
            }),
            level: {
                ...createLevel(createObstacle()),
                milestones: [
                    {
                        buildingType: 'market',
                        coords: { lat: 0, lng: 0 },
                        id: milestoneId,
                        label: 'Safe Haven',
                        missionText: 'Arrive safely.',
                    },
                ],
            },
            levelState: {
                completedMilestoneIds: [milestoneId],
                completedTeacherIds: [],
                isComplete: false,
                lockedHadith: 0,
                nextObjective: null,
                objectives: [],
                tokens: [],
            },
        });

        expect(diagnostic?.eventName).toBe('OBSTACLE_SUPPRESSED_SAFE_ZONE');
        expect(diagnostic?.suppressionReason).toBe('safe-zone');
        expect(diagnostic?.safeZoneSuppressed).toBe(true);
    });

    it('reports nearby approach when outside the trigger radius but still inside the diagnostic margin', () => {
        const diagnostic = resolveObstacleDiagnostic(
            createState({
                playerCoords: { lat: 0.55, lng: 0 },
            }),
        );

        expect(diagnostic?.eventName).toBe('OBSTACLE_NEARBY');
        expect(diagnostic?.suppressionReason).toBe('outside-trigger-radius');
        expect(diagnostic?.withinTriggerRadius).toBe(false);
    });

    it('prefers the obstacle with the nearest trigger edge when radii differ', () => {
        const smallRadiusObstacle = createObstacle({
            coords: { lat: 0.28, lng: 0 },
            id: 'small-radius',
            label: 'Small Radius',
            radius: 10_000,
            type: 'guard',
        });
        const largeRadiusObstacle = createObstacle({
            coords: { lat: 0.32, lng: 0 },
            id: 'large-radius',
            label: 'Large Radius',
            radius: 40_000,
            type: 'guard',
        });
        const state = createState({
            hadithTokens: 8,
            obstacle: smallRadiusObstacle,
            playerCoords: { lat: 0, lng: 0 },
        });

        const diagnostic = resolveObstacleDiagnostic({
            ...state,
            level: {
                ...state.level,
                obstacles: [smallRadiusObstacle, largeRadiusObstacle],
            },
        });

        expect(diagnostic?.obstacleId).toBe('large-radius');
        expect(diagnostic?.withinTriggerRadius).toBe(true);
    });
});
