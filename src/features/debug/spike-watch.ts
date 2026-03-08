import { atharDebugLog } from '@/features/debug/debug';

type ActiveSpikeWatch = {
    endsAtMs: number;
    label: string;
    startedAtMs: number;
};

let activeSpikeWatch: ActiveSpikeWatch | null = null;

const getNowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export const beginSpikeWatch = (label: string, durationMs = 1_200) => {
    const startedAtMs = getNowMs();
    activeSpikeWatch = {
        endsAtMs: startedAtMs + durationMs,
        label,
        startedAtMs,
    };

    atharDebugLog('hud', 'SPIKE_WATCH_START', { durationMs, label });
};

export const getActiveSpikeWatch = () => {
    if (!activeSpikeWatch) {
        return null;
    }

    if (activeSpikeWatch.endsAtMs <= getNowMs()) {
        activeSpikeWatch = null;
        return null;
    }

    return activeSpikeWatch;
};
