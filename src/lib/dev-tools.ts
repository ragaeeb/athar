import { useEffect } from 'react';

import { meetsWinCondition } from '@/game/engine/CollisionSystem';
import { resolveCameraFollow, resolveMovementStep, shouldAutoFollowCamera } from '@/game/engine/player-motion';
import { getLevelById } from '@/game/levels';
import type { Coords } from '@/game/levels/level.types';
import { useGameStore } from '@/game/store/game.store';
import { useLevelStore } from '@/game/store/level.store';
import { usePlayerStore } from '@/game/store/player.store';
import { BASE_PLAYER_SPEED_METERS_PER_SECOND, CHARACTER_CONFIGS } from '@/lib/constants';
import { atharDebugLog, installAtharDebugControls } from '@/lib/debug';
import {
    getLastManualMapInteractionAt,
    getPerfMapViewController,
    getPerfSnapshot,
    type PerfSnapshot,
    recordCameraFollow,
    recordCameraFollowCooldownSkip,
    recordFrameDeltaMs,
    recordPlayerMovementTick,
    resetPerfMetrics,
    updateMapViewSnapshot,
} from '@/lib/perf-metrics';

const PERF_CAMERA_FOLLOW_DAMPING = 10;
const PERF_CAMERA_FOLLOW_DEADZONE_METERS = 80;
const PERF_CAMERA_FOLLOW_MAX_SPEED_MPS = BASE_PLAYER_SPEED_METERS_PER_SECOND * 1.5;
const PERF_MANUAL_CAMERA_INTERACTION_COOLDOWN_MS = 900;

type AtharDevTools = {
    teleportToTeacher: () => void;
    teleportToFinalMilestone: () => void;
    grantTokens: (count?: number) => void;
    completeLevel: () => void;
    resetPerfMetrics: () => void;
    getPerfSnapshot: () => PerfSnapshot;
    setMapView: (view: { bearing?: number; center?: Coords; pitch?: number; zoom?: number }) => void;
    getMapView: () => {
        bearing: number | null;
        center: Coords | null;
        pitch: number | null;
        zoom: number | null;
    };
    simulatePerfFrames: (options: { durationMs: number; moveX?: number; moveZ?: number; stepMs?: number }) => void;
};

type AtharDevWindow = Window & typeof globalThis & { __atharDev__?: AtharDevTools };

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

                useLevelStore.getState().completeTeacher(level.winCondition.requiredTeachers[0] ?? '');
                useLevelStore.getState().completeMilestone(level.winCondition.finalMilestone);
                useLevelStore.getState().addLockedHadith(level.winCondition.requiredHadith);
                useGameStore.getState().addVerifiedHadith(level.winCondition.requiredHadith);
                useLevelStore.getState().setComplete(true);
            },
            getMapView: () => getPerfMapViewController()?.getMapView() ?? getPerfSnapshot().map,
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
            resetPerfMetrics: () => {
                resetPerfMetrics();
            },
            setMapView: (view) => {
                getPerfMapViewController()?.setMapView(view);
            },
            simulatePerfFrames: ({ durationMs, moveX = 0, moveZ = 0, stepMs = 16.67 }) => {
                const level = getLevelById(levelId);
                const mapViewController = getPerfMapViewController();
                if (!level || !mapViewController) {
                    return;
                }

                const steps = Math.max(1, Math.ceil(durationMs / stepMs));
                const characterConfig = CHARACTER_CONFIGS[useGameStore.getState().selectedCharacter];
                let scenarioNow = performance.now();

                for (let step = 0; step < steps; step += 1) {
                    const delta = stepMs / 1_000;
                    recordFrameDeltaMs(stepMs);

                    const playerState = usePlayerStore.getState();
                    const hasMovement = moveX !== 0 || moveZ !== 0;

                    if (hasMovement) {
                        recordPlayerMovementTick();

                        const movement = resolveMovementStep({
                            delta,
                            moveX,
                            moveZ,
                            origin: level.origin,
                            positionMeters: playerState.positionMeters,
                            scrambleMultiplier: playerState.scrambleUntil > Date.now() ? -1 : 1,
                            speed: BASE_PLAYER_SPEED_METERS_PER_SECOND * characterConfig.speedMultiplier,
                        });

                        usePlayerStore.getState().setLocation(movement.nextCoords, movement.nextPositionMeters);
                        usePlayerStore
                            .getState()
                            .setBearingAndSpeed(
                                movement.bearing,
                                BASE_PLAYER_SPEED_METERS_PER_SECOND * characterConfig.speedMultiplier,
                            );
                    }

                    scenarioNow += stepMs;

                    const currentMapView = mapViewController.getMapView();
                    if (!currentMapView.center) {
                        continue;
                    }

                    const autoFollowEnabled = shouldAutoFollowCamera({
                        cooldownMs: PERF_MANUAL_CAMERA_INTERACTION_COOLDOWN_MS,
                        lastManualInteractionAt: getLastManualMapInteractionAt(),
                        now: scenarioNow,
                    });

                    if (!autoFollowEnabled) {
                        recordCameraFollowCooldownSkip();
                        continue;
                    }

                    const follow = resolveCameraFollow({
                        currentCenter: currentMapView.center,
                        damping: PERF_CAMERA_FOLLOW_DAMPING,
                        deadzoneMeters: PERF_CAMERA_FOLLOW_DEADZONE_METERS,
                        delta,
                        maxSpeedMetersPerSecond: PERF_CAMERA_FOLLOW_MAX_SPEED_MPS,
                        targetCoords: usePlayerStore.getState().coords,
                    });

                    if (!follow.moved) {
                        continue;
                    }

                    recordCameraFollow({
                        appliedStepMeters: follow.appliedStepMeters,
                        distanceFromTargetMeters: follow.distanceFromCamera,
                    });
                    mapViewController.jumpToMapView({
                        center: follow.nextCenter,
                    });
                    updateMapViewSnapshot(mapViewController.getMapView());
                }
            },
            teleportToFinalMilestone: () => {
                const level = getLevelById(levelId);
                if (!level) {
                    return;
                }

                const milestone = level?.milestones.find((entry) => entry.id === level.winCondition.finalMilestone);
                if (!milestone) {
                    return;
                }

                usePlayerStore.getState().setCoords(milestone.coords, level.origin);
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
                const teacher = level?.teachers[0];
                if (!teacher) {
                    return;
                }

                usePlayerStore.getState().setCoords(teacher.coords, level.origin);
                usePlayerStore.getState().openDialogue(teacher);
            },
        };

        return () => {
            atharDebugLog('route', 'dev-tools:detached', { levelId });
            delete windowWithDevTools.__atharDev__;
        };
    }, [levelId]);
};
