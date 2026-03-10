import { useEffect } from 'react';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { getLevelById } from '@/content/levels/registry';
import type { Coords } from '@/content/levels/types';
import { atharDebugLog, installAtharDebugControls } from '@/features/debug/debug';
import {
    clearManualCameraOverride,
    getLastManualMapInteractionAt,
    getPerfMapViewController,
    getPerfSnapshot,
    isManualCameraOverrideActive,
    type PerfSnapshot,
    recordCameraFollow,
    recordCameraFollowCooldownSkip,
    recordFrameDeltaMs,
    recordPlayerMovementTick,
    resetPerfMetrics,
    updateMapViewSnapshot,
} from '@/features/debug/perf-metrics';
import {
    getPlayerRuntimeState,
    setPlayerRuntimeCoords,
    updatePlayerRuntimeMovement,
} from '@/features/gameplay/runtime/player-runtime';
import { meetsWinCondition } from '@/features/gameplay/simulation/systems/CollisionSystem';
import { resolveMovementStep } from '@/features/gameplay/simulation/systems/movement-utils';
import { useGameStore } from '@/features/gameplay/state/game.store';
import { useLevelStore } from '@/features/gameplay/state/level.store';
import { usePlayerStore } from '@/features/gameplay/state/player.store';
import { resolveCameraSnapFollow, shouldAutoFollowCamera } from '@/features/gameplay/systems/player-motion';
import { BASE_PLAYER_SPEED_METERS_PER_SECOND } from '@/shared/constants/gameplay';
import { worldDistanceInMeters } from '@/shared/geo';

const PERF_CAMERA_FOLLOW_SNAP_DEADZONE_METERS = 12_000;
const PERF_MANUAL_CAMERA_INTERACTION_COOLDOWN_MS = 900;

type AtharDevTools = {
    levelId: string;
    teleportToTeacher: () => void;
    teleportToFinalMilestone: () => void;
    grantTokens: (count?: number) => void;
    completeLevel: () => void;
    resetPerfMetrics: () => void;
    getPerfSnapshot: () => PerfSnapshot;
    getLastPerfSnapshot: () => PerfSnapshot;
    setMapView: (view: { bearing?: number; center?: Coords; pitch?: number; zoom?: number }) => void;
    getMapView: () => {
        bearing: number | null;
        center: Coords | null;
        pitch: number | null;
        zoom: number | null;
    } | null;
    simulatePerfFrames: (options: { durationMs: number; moveX?: number; moveZ?: number; stepMs?: number }) => void;
};

type AtharDevWindow = Window & typeof globalThis & { __atharDev__?: AtharDevTools };

const validatePerfSimulationOptions = (options: {
    durationMs: number;
    moveX?: number;
    moveZ?: number;
    stepMs?: number;
}) => {
    if (!Number.isFinite(options.stepMs ?? 16.67) || (options.stepMs ?? 16.67) <= 0) {
        throw new Error('stepMs must be a finite number greater than 0');
    }
    if (!Number.isFinite(options.durationMs) || options.durationMs < 0) {
        throw new Error('durationMs must be a finite number greater than or equal to 0');
    }
};

const applySimulatedMovementStep = ({
    characterSpeedMultiplier,
    delta,
    moveX,
    moveZ,
    origin,
    playerState,
    scenarioEpochNow,
}: {
    characterSpeedMultiplier: number;
    delta: number;
    moveX: number;
    moveZ: number;
    origin: Coords;
    playerState: ReturnType<typeof usePlayerStore.getState>;
    scenarioEpochNow: number;
}) => {
    if (moveX === 0 && moveZ === 0) {
        return;
    }

    recordPlayerMovementTick();

    const movement = resolveMovementStep({
        delta,
        moveX,
        moveZ,
        origin,
        positionMeters: getPlayerRuntimeState().positionMeters,
        scrambleMultiplier: playerState.scrambleUntil > scenarioEpochNow ? -1 : 1,
        speed: BASE_PLAYER_SPEED_METERS_PER_SECOND * characterSpeedMultiplier,
    });

    updatePlayerRuntimeMovement({
        bearing: movement.bearing,
        coords: movement.nextCoords,
        positionMeters: movement.nextPositionMeters,
        speed: BASE_PLAYER_SPEED_METERS_PER_SECOND * characterSpeedMultiplier,
    });
};

const applySimulatedCameraFollow = ({
    mapViewController,
    scenarioNow,
}: {
    mapViewController: NonNullable<ReturnType<typeof getPerfMapViewController>>;
    scenarioNow: number;
}) => {
    const currentMapView = mapViewController.getMapView();
    if (!currentMapView.center) {
        return;
    }

    const targetCoords = getPlayerRuntimeState().coords;
    if (isManualCameraOverrideActive()) {
        if (worldDistanceInMeters(targetCoords, currentMapView.center) <= PERF_CAMERA_FOLLOW_SNAP_DEADZONE_METERS) {
            clearManualCameraOverride();
        } else {
            recordCameraFollowCooldownSkip();
            return;
        }
    }

    const autoFollowEnabled = shouldAutoFollowCamera({
        cooldownMs: PERF_MANUAL_CAMERA_INTERACTION_COOLDOWN_MS,
        lastManualInteractionAt: getLastManualMapInteractionAt(),
        now: scenarioNow,
    });

    if (!autoFollowEnabled) {
        recordCameraFollowCooldownSkip();
        return;
    }

    const follow = resolveCameraSnapFollow({
        currentCenter: currentMapView.center,
        deadzoneMeters: PERF_CAMERA_FOLLOW_SNAP_DEADZONE_METERS,
        targetCoords,
    });

    if (!follow.moved) {
        return;
    }

    recordCameraFollow({
        appliedStepMeters: follow.appliedStepMeters,
        distanceFromTargetMeters: follow.distanceFromCamera,
    });
    mapViewController.jumpToMapView({
        center: follow.nextCenter,
    });
    updateMapViewSnapshot(mapViewController.getMapView());
};

const simulatePerfFramesForLevel = ({
    characterId,
    levelId,
    options,
}: {
    characterId: keyof typeof CHARACTER_CONFIGS;
    levelId: string;
    options: { durationMs: number; moveX?: number; moveZ?: number; stepMs?: number };
}) => {
    validatePerfSimulationOptions(options);

    const level = getLevelById(levelId);
    const mapViewController = getPerfMapViewController();
    if (!level || !mapViewController) {
        return;
    }

    const { durationMs, moveX = 0, moveZ = 0, stepMs = 16.67 } = options;
    const steps = Math.max(1, Math.ceil(durationMs / stepMs));
    const characterConfig = CHARACTER_CONFIGS[characterId];
    let scenarioNow = performance.now();
    let scenarioEpochNow = Date.now();

    for (let step = 0; step < steps; step += 1) {
        const delta = stepMs / 1_000;
        recordFrameDeltaMs(stepMs);

        applySimulatedMovementStep({
            characterSpeedMultiplier: characterConfig.speedMultiplier,
            delta,
            moveX,
            moveZ,
            origin: level.origin,
            playerState: usePlayerStore.getState(),
            scenarioEpochNow,
        });

        scenarioNow += stepMs;
        scenarioEpochNow += stepMs;
        applySimulatedCameraFollow({
            mapViewController,
            scenarioNow,
        });
    }
};

export const useAtharDevTools = (levelId: string | undefined) => {
    useEffect(() => {
        if (!(import.meta.env.DEV || import.meta.env.MODE === 'test') || !levelId) {
            return;
        }

        installAtharDebugControls();
        atharDebugLog('route', 'dev-tools:attached', { levelId });

        const windowWithDevTools = window as AtharDevWindow;
        windowWithDevTools.__atharDev__ = {
            completeLevel: () => {
                const level = getLevelById(levelId);
                if (!level) {
                    return;
                }

                for (const teacherId of level.winCondition.requiredTeachers) {
                    useLevelStore.getState().completeTeacher(teacherId);
                }

                useLevelStore.getState().completeMilestone(level.winCondition.finalMilestone);
                useLevelStore.getState().addLockedHadith(level.winCondition.requiredHadith);
                useLevelStore.getState().setComplete(true);
            },
            getLastPerfSnapshot: () => getPerfSnapshot(),
            getMapView: () => {
                const mapViewController = getPerfMapViewController();
                return mapViewController ? mapViewController.getMapView() : null;
            },
            getPerfSnapshot: () => {
                const mapViewController = getPerfMapViewController();
                if (mapViewController) {
                    updateMapViewSnapshot(mapViewController.getMapView());
                }

                return getPerfSnapshot();
            },
            grantTokens: (count = 30) => {
                usePlayerStore.getState().addToken(count);
            },
            levelId,
            resetPerfMetrics: () => {
                resetPerfMetrics();
            },
            setMapView: (view) => {
                const mapViewController = getPerfMapViewController();
                if (!mapViewController) {
                    return;
                }

                mapViewController.setMapView(view);
            },
            simulatePerfFrames: (options) =>
                simulatePerfFramesForLevel({
                    characterId: useGameStore.getState().selectedCharacter,
                    levelId,
                    options,
                }),
            teleportToFinalMilestone: () => {
                const level = getLevelById(levelId);
                if (!level) {
                    return;
                }

                const milestone = level?.milestones.find((entry) => entry.id === level.winCondition.finalMilestone);
                if (!milestone) {
                    return;
                }

                setPlayerRuntimeCoords(milestone.coords, level.origin);
                useLevelStore.getState().completeMilestone(milestone.id);

                if (
                    meetsWinCondition(
                        level,
                        useLevelStore.getState().completedTeacherIds,
                        useLevelStore.getState().completedMilestoneIds,
                        useLevelStore.getState().lockedHadith,
                        usePlayerStore.getState().hadithTokens,
                    )
                ) {
                    useLevelStore.getState().setComplete(true);
                }
            },
            teleportToTeacher: () => {
                const level = getLevelById(levelId);
                if (!level) {
                    return;
                }

                const teacher = level.teachers.find(
                    (entry) => !useLevelStore.getState().completedTeacherIds.includes(entry.id),
                );
                if (!teacher) {
                    return;
                }

                setPlayerRuntimeCoords(teacher.coords, level.origin);
                usePlayerStore.getState().openDialogue(teacher);
            },
        };

        return () => {
            atharDebugLog('route', 'dev-tools:detached', { levelId });
            delete windowWithDevTools.__atharDev__;
        };
    }, [levelId]);

    useEffect(() => {
        if (!(import.meta.env.DEV || import.meta.env.MODE === 'test') || typeof PerformanceObserver === 'undefined') {
            return;
        }

        const supportedEntryTypes = PerformanceObserver.supportedEntryTypes ?? [];
        if (!supportedEntryTypes.includes('longtask')) {
            return;
        }

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                atharDebugLog('route', 'LONG_TASK', {
                    durationMs: entry.duration,
                    name: entry.name,
                    startTimeMs: entry.startTime,
                });
            }
        });

        observer.observe({ entryTypes: ['longtask'] });

        return () => {
            observer.disconnect();
        };
    }, []);
};
