import {
    getMotionDiagnosticFrames,
    getMotionDiagnosticSummary,
    resetMotionDiagnostics,
} from '@/features/debug/motion-diagnostics';

type AtharDebugChannel =
    | 'camera'
    | 'controller'
    | 'hud'
    | 'map'
    | 'motion'
    | 'player'
    | 'player-marker'
    | 'route'
    | 'store';

type AtharDebugEntry = {
    timestamp: string;
    channel: AtharDebugChannel;
    event: string;
    payload?: unknown;
};

type AtharDebugControls = {
    enabled: boolean;
    clear: () => void;
    disable: () => void;
    enable: () => void;
    logs: AtharDebugEntry[];
    motionFrames: () => ReturnType<typeof getMotionDiagnosticFrames>;
    motionSummary: () => ReturnType<typeof getMotionDiagnosticSummary>;
    text: () => string;
};

type AtharDebugWindow = Window &
    typeof globalThis & {
        __atharDebug__?: AtharDebugControls;
    };

type DebugLogOptions = {
    throttleMs?: number;
    throttleKey?: string;
};

const MAX_DEBUG_LOGS = 800;
const throttleState = new Map<string, number>();
const logBuffer: AtharDebugEntry[] = [];

const normalizeDebugValue = (value: unknown): unknown => {
    if (value instanceof Error) {
        return {
            message: value.message,
            name: value.name,
            stack: value.stack,
        };
    }

    if (typeof value === 'number' && !Number.isFinite(value)) {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value.map((entry) => normalizeDebugValue(entry));
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeDebugValue(entry)]));
    }

    return value;
};

const formatScalarValue = (value: unknown): string => {
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return String(value);
        }

        return String(Math.round(value * 1_000) / 1_000);
    }

    if (typeof value === 'string') {
        return /\s/.test(value) ? JSON.stringify(value) : value;
    }

    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }

    if (value === null) {
        return 'null';
    }

    if (value === undefined) {
        return 'undefined';
    }

    return JSON.stringify(value);
};

const flattenDebugValue = (value: unknown, prefix = 'payload'): string[] => {
    const normalized = normalizeDebugValue(value);
    const label = prefix || 'payload';

    if (Array.isArray(normalized)) {
        return [`${label}=[${normalized.map((entry) => formatScalarValue(entry)).join(',')}]`];
    }

    if (normalized && typeof normalized === 'object') {
        const entries = Object.entries(normalized);
        if (entries.length === 0) {
            return [`${label}={}`];
        }

        return entries.flatMap(([key, entry]) => flattenDebugValue(entry, prefix ? `${prefix}.${key}` : key));
    }

    return [`${label}=${formatScalarValue(normalized)}`];
};

const formatDebugLine = ({ channel, event, payload }: AtharDebugEntry) => {
    const parts = [`[athar:${channel}]`, event];
    if (payload !== undefined) {
        parts.push(...flattenDebugValue(payload, ''));
    }

    return parts.join(' ').trim();
};

const canUseWindow = () => typeof window !== 'undefined';

const initialDebugEnabled = () => {
    if (!import.meta.env.DEV || !canUseWindow()) {
        return false;
    }

    const url = new URL(window.location.href);
    return url.searchParams.get('atharDebug') === '1';
};

let debugEnabled = initialDebugEnabled();

const syncWindowControls = () => {
    if (!canUseWindow()) {
        return;
    }

    const windowWithDebug = window as AtharDebugWindow;
    windowWithDebug.__atharDebug__ = {
        clear: () => {
            logBuffer.length = 0;
            resetMotionDiagnostics();
            console.info('[athar:debug] cleared log buffer');
        },
        disable: () => {
            debugEnabled = false;
            syncWindowControls();
            console.info('[athar:debug] disabled');
        },
        enable: () => {
            debugEnabled = true;
            syncWindowControls();
            console.info('[athar:debug] enabled');
        },
        enabled: debugEnabled,
        logs: logBuffer,
        motionFrames: () => getMotionDiagnosticFrames(),
        motionSummary: () => getMotionDiagnosticSummary(),
        text: () => logBuffer.map((entry) => formatDebugLine(entry)).join('\n'),
    };
};

export const installAtharDebugControls = () => {
    if (!import.meta.env.DEV || !canUseWindow()) {
        return;
    }

    syncWindowControls();
};

export const isAtharDebugEnabled = () => import.meta.env.DEV && debugEnabled;

export const atharDebugLog = (
    channel: AtharDebugChannel,
    event: string,
    payload?: unknown,
    options?: DebugLogOptions,
) => {
    if (!import.meta.env.DEV || !debugEnabled) {
        return;
    }

    const throttleKey = options?.throttleKey ?? `${channel}:${event}`;
    const throttleMs = options?.throttleMs ?? 0;
    const now = performance.now();
    const lastLogAt = throttleState.get(throttleKey) ?? 0;

    if (throttleMs > 0 && now - lastLogAt < throttleMs) {
        return;
    }

    throttleState.set(throttleKey, now);

    const entry: AtharDebugEntry = {
        channel,
        event,
        payload,
        timestamp: new Date().toISOString(),
    };

    logBuffer.push(entry);
    if (logBuffer.length > MAX_DEBUG_LOGS) {
        logBuffer.shift();
    }

    console.log(formatDebugLine(entry));
};
