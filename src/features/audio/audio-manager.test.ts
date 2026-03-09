import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MockHowlOptions = {
    loop?: boolean;
    onload?: () => void;
    onloaderror?: (soundId: number, error: unknown) => void;
    onplayerror?: (soundId: number, error: unknown) => void;
    preload?: boolean;
    src: string[];
    volume?: number;
};

const howlInstances: MockHowl[] = [];

class MockHowl {
    load = vi.fn(() => {
        this.options.onload?.();
    });

    play = vi.fn();

    stop = vi.fn();

    unload = vi.fn();

    constructor(private options: MockHowlOptions) {
        howlInstances.push(this);
    }
}

vi.mock('howler', () => ({
    Howl: MockHowl,
}));

const flushMicrotasks = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

describe('audioManager', () => {
    beforeEach(() => {
        howlInstances.length = 0;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('disables audio when the configured assets are missing', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                headers: {
                    get: () => null,
                },
                ok: false,
            }),
        );
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        vi.resetModules();
        const { audioManager } = await import('@/features/audio/audio-manager');

        audioManager.bootstrap();
        await flushMicrotasks();
        audioManager.play('collect-token');

        expect(howlInstances).toHaveLength(0);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            '[athar:audio] AUDIO DISABLED: configured audio files are missing or unreadable',
        );
    });

    it('loads and plays cues after the configured assets verify successfully', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                headers: {
                    get: () => 'audio/mpeg',
                },
                ok: true,
            }),
        );

        vi.resetModules();
        const { audioManager } = await import('@/features/audio/audio-manager');

        audioManager.bootstrap();
        await flushMicrotasks();
        audioManager.play('collect-token');

        expect(howlInstances).toHaveLength(1);
        expect(howlInstances[0]?.load).toHaveBeenCalledTimes(1);
        expect(howlInstances[0]?.play).toHaveBeenCalledTimes(1);
    });
});
