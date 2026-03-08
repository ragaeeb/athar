export type MotionDiagnosticFrame = {
    cameraCommitStepMeters: number;
    cameraCenterStepMeters: number;
    frameDeltaMs: number;
    jumpToDurationMs: number;
    localStepMeters: number;
    screenOffsetPx: number;
    screenStepPx: number;
    sequence: number;
    speed: number;
    timestampMs: number;
    worldStepMeters: number;
};

export type MotionDiagnosticSource =
    | 'camera-follow'
    | 'frame-spike'
    | 'local-motion'
    | 'none'
    | 'screen-space'
    | 'simulation-cadence'
    | 'world-transform';

export type MotionDiagnosticSummary = {
    avgCameraCenterVelocityMps: number;
    avgCameraCommitVelocityMps: number;
    avgFrameDeltaMs: number;
    avgJumpToDurationMs: number;
    avgLocalVelocityMps: number;
    avgScreenOffsetPx: number;
    avgScreenVelocityPxPerSecond: number;
    avgWorldVelocityMps: number;
    cameraCenterVelocityCv: number;
    cameraCommitCount: number;
    cameraCommitVelocityCv: number;
    frameCount: number;
    likelySource: MotionDiagnosticSource;
    longFrameCount: number;
    maxJumpToDurationMs: number;
    p95FrameDeltaMs: number;
    screenOffsetCv: number;
    screenVelocityCv: number;
    sequenceRepeatCount: number;
    severity: number;
    worldVelocityCv: number;
    localVelocityCv: number;
};

export type MotionDiagnosticEventType =
    | 'CAMERA_FOLLOW_JITTER'
    | 'FRAME_SPIKE_CLUSTER'
    | 'LOCAL_MOTION_JITTER'
    | 'MOTION_TRACE_SUMMARY'
    | 'SCREEN_SPACE_JITTER'
    | 'SEQUENCE_STALL'
    | 'WORLD_TRANSFORM_JITTER';

export type MotionDiagnosticEvent = {
    summary: MotionDiagnosticSummary;
    type: MotionDiagnosticEventType;
};

const MAX_MOTION_FRAMES = 600;
const MIN_TRACE_FRAMES = 12;
const ALERT_WINDOW_FRAMES = 18;
const SUMMARY_INTERVAL_FRAMES = 120;
const MIN_MOVING_SPEED = 1;
const SCREEN_SPACE_JITTER_SEVERITY_THRESHOLD = 0.25;
const FRAME_SPIKE_CLUSTER_SEVERITY_THRESHOLD = 0.18;

const allFrames: MotionDiagnosticFrame[] = [];
let activeTrace: MotionDiagnosticFrame[] = [];
let lastSummary: MotionDiagnosticSummary | null = null;
const lastAlertAtMs = new Map<MotionDiagnosticEventType, number>();

const average = (values: number[]) =>
    values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;

const coefficientOfVariation = (values: number[]) => {
    if (values.length < 2) {
        return 0;
    }

    const mean = average(values);
    if (mean === 0) {
        return 0;
    }

    const variance = average(values.map((value) => (value - mean) ** 2));
    return Math.sqrt(variance) / mean;
};

const percentile = (values: number[], percentileRank: number) => {
    if (values.length === 0) {
        return 0;
    }

    const sorted = [...values].sort((left, right) => left - right);
    const rawIndex = Math.ceil(sorted.length * percentileRank) - 1;
    const index = Math.min(sorted.length - 1, Math.max(0, rawIndex));
    return sorted[index] ?? 0;
};

const toVelocity = (distanceMeters: number, frameDeltaMs: number) =>
    frameDeltaMs > 0 ? distanceMeters / (frameDeltaMs / 1_000) : 0;

const hasScreenSpaceJitter = ({
    cameraCommitCount,
    localVelocityCv,
    screenOffsetCv,
    screenVelocityCv,
}: {
    cameraCommitCount: number;
    localVelocityCv: number;
    screenOffsetCv: number;
    screenVelocityCv: number;
}) => screenVelocityCv > localVelocityCv + 0.08 || (cameraCommitCount > 0 && screenOffsetCv > 0.18);

const summarizeFrames = (frames: MotionDiagnosticFrame[]): MotionDiagnosticSummary => {
    const localVelocities = frames.map((frame) => toVelocity(frame.localStepMeters, frame.frameDeltaMs));
    const screenVelocities = frames.map((frame) => toVelocity(frame.screenStepPx, frame.frameDeltaMs));
    const worldVelocities = frames.map((frame) => toVelocity(frame.worldStepMeters, frame.frameDeltaMs));
    const cameraCenterVelocities = frames
        .filter((frame) => frame.cameraCenterStepMeters > 0)
        .map((frame) => toVelocity(frame.cameraCenterStepMeters, frame.frameDeltaMs));
    const cameraCommitVelocities = frames
        .filter((frame) => frame.cameraCommitStepMeters > 0)
        .map((frame) => toVelocity(frame.cameraCommitStepMeters, frame.frameDeltaMs));
    const frameDeltas = frames.map((frame) => frame.frameDeltaMs);
    const jumpToDurations = frames
        .filter((frame) => frame.jumpToDurationMs >= 0)
        .map((frame) => frame.jumpToDurationMs);
    const screenOffsets = frames.map((frame) => frame.screenOffsetPx);

    const localVelocityCv = coefficientOfVariation(localVelocities);
    const screenVelocityCv = coefficientOfVariation(screenVelocities);
    const screenOffsetCv = coefficientOfVariation(screenOffsets);
    const worldVelocityCv = coefficientOfVariation(worldVelocities);
    const cameraCommitVelocityCv = coefficientOfVariation(cameraCommitVelocities);
    const cameraCenterVelocityCv = coefficientOfVariation(cameraCenterVelocities);
    const sequenceRepeatCount = frames.reduce((count, frame, index) => {
        if (index === 0) {
            return count;
        }

        return count + (frame.sequence === frames[index - 1]?.sequence ? 1 : 0);
    }, 0);
    const longFrameCount = frames.filter((frame) => frame.frameDeltaMs > 20).length;

    let likelySource: MotionDiagnosticSource = 'none';
    let severity = 0;

    if (sequenceRepeatCount > 0) {
        likelySource = 'simulation-cadence';
        severity = Math.max(severity, sequenceRepeatCount / frames.length);
    }

    if (localVelocityCv > 0.14) {
        likelySource = 'local-motion';
        severity = Math.max(severity, localVelocityCv);
    }

    if (
        hasScreenSpaceJitter({
            cameraCommitCount: cameraCommitVelocities.length,
            localVelocityCv,
            screenOffsetCv,
            screenVelocityCv,
        })
    ) {
        likelySource = 'screen-space';
        severity = Math.max(severity, screenVelocityCv - localVelocityCv, screenOffsetCv);
    }

    if (worldVelocityCv > localVelocityCv + 0.1) {
        likelySource = 'world-transform';
        severity = Math.max(severity, worldVelocityCv - localVelocityCv);
    }

    if (
        cameraCommitVelocities.length >= Math.max(6, Math.floor(frames.length / 3)) &&
        cameraCommitVelocityCv > localVelocityCv + 0.12
    ) {
        likelySource = 'camera-follow';
        severity = Math.max(severity, cameraCommitVelocityCv - localVelocityCv);
    }

    if (longFrameCount >= 2 || (jumpToDurations.length > 0 && Math.max(...jumpToDurations) > 4)) {
        likelySource = likelySource === 'none' ? 'frame-spike' : likelySource;
        severity = Math.max(severity, longFrameCount / frames.length);
    }

    return {
        avgCameraCenterVelocityMps: average(cameraCenterVelocities),
        avgCameraCommitVelocityMps: average(cameraCommitVelocities),
        avgFrameDeltaMs: average(frameDeltas),
        avgJumpToDurationMs: average(jumpToDurations),
        avgLocalVelocityMps: average(localVelocities),
        avgScreenOffsetPx: average(screenOffsets),
        avgScreenVelocityPxPerSecond: average(screenVelocities),
        avgWorldVelocityMps: average(worldVelocities),
        cameraCenterVelocityCv,
        cameraCommitCount: cameraCommitVelocities.length,
        cameraCommitVelocityCv,
        frameCount: frames.length,
        likelySource,
        localVelocityCv,
        longFrameCount,
        maxJumpToDurationMs: jumpToDurations.length > 0 ? Math.max(...jumpToDurations) : 0,
        p95FrameDeltaMs: percentile(frameDeltas, 0.95),
        screenOffsetCv,
        screenVelocityCv,
        sequenceRepeatCount,
        severity,
        worldVelocityCv,
    };
};

const classifySummary = (summary: MotionDiagnosticSummary): MotionDiagnosticEventType | null => {
    if (summary.sequenceRepeatCount > 0) {
        return 'SEQUENCE_STALL';
    }

    if (summary.localVelocityCv > 0.14) {
        return 'LOCAL_MOTION_JITTER';
    }

    if (
        hasScreenSpaceJitter({
            cameraCommitCount: summary.cameraCommitCount,
            localVelocityCv: summary.localVelocityCv,
            screenOffsetCv: summary.screenOffsetCv,
            screenVelocityCv: summary.screenVelocityCv,
        }) &&
        summary.severity >= SCREEN_SPACE_JITTER_SEVERITY_THRESHOLD
    ) {
        return 'SCREEN_SPACE_JITTER';
    }

    if (summary.worldVelocityCv > summary.localVelocityCv + 0.1) {
        return 'WORLD_TRANSFORM_JITTER';
    }

    if (
        summary.cameraCommitCount >= Math.max(6, Math.floor(summary.frameCount / 3)) &&
        summary.cameraCommitVelocityCv > summary.localVelocityCv + 0.12
    ) {
        return 'CAMERA_FOLLOW_JITTER';
    }

    if (
        (summary.longFrameCount >= 2 || summary.maxJumpToDurationMs > 4) &&
        summary.severity >= FRAME_SPIKE_CLUSTER_SEVERITY_THRESHOLD
    ) {
        return 'FRAME_SPIKE_CLUSTER';
    }

    return null;
};

const shouldEmitAlert = (type: MotionDiagnosticEventType, timestampMs: number) => {
    const lastAtMs = lastAlertAtMs.get(type);
    if (lastAtMs !== undefined && timestampMs - lastAtMs < 1_500) {
        return false;
    }

    lastAlertAtMs.set(type, timestampMs);
    return true;
};

export const getMotionDiagnosticFrames = () => [...allFrames];

export const getMotionDiagnosticSummary = () => lastSummary;

export const resetMotionDiagnostics = () => {
    allFrames.length = 0;
    activeTrace = [];
    lastSummary = null;
    lastAlertAtMs.clear();
};

export const recordMotionDiagnosticFrame = (frame: MotionDiagnosticFrame): MotionDiagnosticEvent[] => {
    allFrames.push(frame);
    if (allFrames.length > MAX_MOTION_FRAMES) {
        allFrames.shift();
    }

    const events: MotionDiagnosticEvent[] = [];
    const moving = frame.speed > MIN_MOVING_SPEED;

    if (!moving) {
        if (activeTrace.length >= MIN_TRACE_FRAMES) {
            lastSummary = summarizeFrames(activeTrace);
            events.push({
                summary: lastSummary,
                type: 'MOTION_TRACE_SUMMARY',
            });
        }

        activeTrace = [];
        return events;
    }

    activeTrace.push(frame);

    if (activeTrace.length >= ALERT_WINDOW_FRAMES && activeTrace.length % 6 === 0) {
        const windowFrames = activeTrace.slice(-ALERT_WINDOW_FRAMES);
        const summary = summarizeFrames(windowFrames);
        lastSummary = summary;
        const alertType = classifySummary(summary);

        if (alertType && shouldEmitAlert(alertType, frame.timestampMs)) {
            events.push({
                summary,
                type: alertType,
            });
        }
    }

    if (activeTrace.length >= SUMMARY_INTERVAL_FRAMES && activeTrace.length % SUMMARY_INTERVAL_FRAMES === 0) {
        lastSummary = summarizeFrames(activeTrace.slice(-SUMMARY_INTERVAL_FRAMES));
        events.push({
            summary: lastSummary,
            type: 'MOTION_TRACE_SUMMARY',
        });
    }

    return events;
};
