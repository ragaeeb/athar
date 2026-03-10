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
    currentVolume = 0;

    fade = vi.fn();

    load = vi.fn(() => {
        this.options.onload?.();
    });

    play = vi.fn();

    stop = vi.fn();

    unload = vi.fn();

    volume = vi.fn((value?: number) => {
        if (typeof value === 'number') {
            this.currentVolume = value;
        }

        return this.currentVolume;
    });

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
        vi.useRealTimers();
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
        await flushMicrotasks();

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
        await flushMicrotasks();

        expect(howlInstances).toHaveLength(1);
        expect(howlInstances[0]?.load).toHaveBeenCalledTimes(1);
        expect(howlInstances[0]?.play).toHaveBeenCalledTimes(1);
    });

    it('does not repeat audio asset verification when bootstrap is called again after readiness', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            headers: {
                get: () => 'audio/mpeg',
            },
            ok: true,
        });
        vi.stubGlobal('fetch', fetchMock);

        vi.resetModules();
        const { audioManager } = await import('@/features/audio/audio-manager');

        audioManager.bootstrap();
        await flushMicrotasks();
        const firstVerificationCalls = fetchMock.mock.calls.length;
        expect(firstVerificationCalls).toBeGreaterThan(0);

        audioManager.bootstrap();
        await flushMicrotasks();

        expect(fetchMock).toHaveBeenCalledTimes(firstVerificationCalls);
    });

    it('keeps core audio enabled when the optional footsteps cue is missing', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockImplementation((input: RequestInfo | URL) =>
                Promise.resolve({
                    headers: {
                        get: () => 'audio/mpeg',
                    },
                    ok: !String(input).includes('footsteps-walk.mp3'),
                }),
            ),
        );

        vi.resetModules();
        const { audioManager } = await import('@/features/audio/audio-manager');

        audioManager.bootstrap();
        await flushMicrotasks();
        audioManager.play('collect-token');
        await flushMicrotasks();

        expect(howlInstances).toHaveLength(1);
        expect(howlInstances[0]?.play).toHaveBeenCalledTimes(1);
    });

    it('starts and stops the footsteps loop only on activation edges', async () => {
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
        audioManager.setLoopActive('footsteps-walk', true);
        audioManager.setLoopActive('footsteps-walk', true);
        audioManager.setLoopActive('footsteps-walk', false);
        audioManager.setLoopActive('footsteps-walk', false);
        await flushMicrotasks();

        expect(howlInstances).toHaveLength(1);
        expect(howlInstances[0]?.play).toHaveBeenCalledTimes(1);
        expect(howlInstances[0]?.stop).toHaveBeenCalledTimes(1);
    });

    it('crossfades ambient cues instead of hard-stopping the previous bed immediately', async () => {
        vi.useFakeTimers();
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
        audioManager.setAmbient('ambient-city');
        audioManager.setAmbient('ambient-desert');
        await flushMicrotasks();

        expect(howlInstances).toHaveLength(2);
        expect(howlInstances[0]?.fade).toHaveBeenCalledWith(0.35, 0, 320);
        expect(howlInstances[0]?.stop).not.toHaveBeenCalled();
        expect(howlInstances[1]?.volume).toHaveBeenCalledWith(0);
        expect(howlInstances[1]?.fade).toHaveBeenCalledWith(0, 0.35, 420);

        vi.advanceTimersByTime(320);

        expect(howlInstances[0]?.stop).toHaveBeenCalledTimes(1);
    });

    it('routes ambient loop activation through ambient bookkeeping', async () => {
        vi.useFakeTimers();
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
        audioManager.setLoopActive('ambient-city', true);
        await flushMicrotasks();
        audioManager.setAmbient('ambient-desert');
        await flushMicrotasks();

        expect(howlInstances).toHaveLength(2);
        expect(howlInstances[0]?.fade).toHaveBeenCalledWith(0.35, 0, 320);
    });
});
