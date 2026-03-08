import { beforeEach, describe, expect, it } from 'vitest';

import {
    getMotionDiagnosticSummary,
    recordMotionDiagnosticFrame,
    resetMotionDiagnostics,
} from '@/features/debug/motion-diagnostics';

const createFrame = (overrides: Partial<Parameters<typeof recordMotionDiagnosticFrame>[0]> = {}) => ({
    cameraCenterStepMeters: 0,
    cameraCommitStepMeters: 0,
    frameDeltaMs: 16.67,
    jumpToDurationMs: -1,
    localStepMeters: 900,
    screenOffsetPx: 24,
    screenStepPx: 8,
    sequence: 1,
    speed: 54_000,
    timestampMs: 0,
    worldStepMeters: 900,
    ...overrides,
});

describe('motion diagnostics', () => {
    beforeEach(() => {
        resetMotionDiagnostics();
    });

    it('flags camera follow jitter when local motion is stable but camera commits oscillate', () => {
        let lastEventType: string | null = null;

        for (let index = 0; index < 18; index += 1) {
            const events = recordMotionDiagnosticFrame(
                createFrame({
                    cameraCenterStepMeters: index % 2 === 0 ? 120 : 980,
                    cameraCommitStepMeters: index % 2 === 0 ? 120 : 980,
                    sequence: index + 1,
                    timestampMs: index * 16.67,
                }),
            );

            lastEventType = events.at(-1)?.type ?? lastEventType;
        }

        expect(lastEventType).toBe('CAMERA_FOLLOW_JITTER');
        expect(getMotionDiagnosticSummary()?.likelySource).toBe('camera-follow');
    });

    it('flags sequence stalls when the same presentation sequence repeats while moving', () => {
        let lastEventType: string | null = null;

        for (let index = 0; index < 18; index += 1) {
            const events = recordMotionDiagnosticFrame(
                createFrame({
                    sequence: index < 9 ? 4 : 5,
                    timestampMs: index * 16.67,
                }),
            );

            lastEventType = events.at(-1)?.type ?? lastEventType;
        }

        expect(lastEventType).toBe('SEQUENCE_STALL');
        expect(getMotionDiagnosticSummary()?.likelySource).toBe('simulation-cadence');
    });

    it('does not flag screen-space jitter for smooth static-camera drift without camera commits', () => {
        let lastEventType: string | null = null;

        for (let index = 0; index < 18; index += 1) {
            const events = recordMotionDiagnosticFrame(
                createFrame({
                    screenOffsetPx: 24 + index * 18,
                    screenStepPx: 18,
                    sequence: index + 1,
                    timestampMs: index * 16.67,
                }),
            );

            lastEventType = events.at(-1)?.type ?? lastEventType;
        }

        expect(lastEventType).toBeNull();
        expect(getMotionDiagnosticSummary()?.likelySource).toBe('none');
    });

    it('suppresses low-severity screen-space jitter alerts even if the classifier source is screen-space', () => {
        let lastEventType: string | null = null;

        for (let index = 0; index < 18; index += 1) {
            const events = recordMotionDiagnosticFrame(
                createFrame({
                    screenOffsetPx: 420 + index * 2,
                    screenStepPx: 10,
                    sequence: index + 1,
                    timestampMs: index * 16.67,
                }),
            );

            lastEventType = events.at(-1)?.type ?? lastEventType;
        }

        expect(lastEventType).toBeNull();
        expect(getMotionDiagnosticSummary()?.severity ?? 0).toBeLessThan(0.25);
    });
});
