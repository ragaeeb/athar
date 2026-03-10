import { Howl } from 'howler';

import { AUDIO_ASSETS, type AudioCue } from '@/content/audio/cues';

type AudioEntry = {
    howl: Howl;
    loopActive: boolean;
    ready: boolean;
};

const OPTIONAL_AUDIO_CUES = new Set<AudioCue>(['footsteps-walk']);
const LOOPING_CUES = new Set<AudioCue>(['ambient-city', 'ambient-desert', 'footsteps-walk']);
const GAMEPLAY_WARMUP_CUES = (Object.keys(AUDIO_ASSETS) as AudioCue[]).filter(
    (cue) => !cue.startsWith('ambient') && cue !== 'footsteps-walk',
);
const AUDIO_CUES = Object.keys(AUDIO_ASSETS) as AudioCue[];
const AMBIENT_VOLUME = 0.35;
const AMBIENT_FADE_IN_MS = 420;
const AMBIENT_FADE_OUT_MS = 320;
const FOOTSTEP_VOLUME = 0.28;
const DEFAULT_SFX_VOLUME = 0.8;

class AtharAudioManager {
    private registry = new Map<AudioCue, AudioEntry>();

    private unavailableCues = new Set<AudioCue>();

    private assetCheckState: 'pending' | 'ready' | 'disabled' = 'pending';

    private pendingActions: Array<() => void> = [];

    private ambientCue: AudioCue | null = null;

    private ambientStopTimeouts = new Map<AudioCue, number>();

    private enabled = true;

    private bootstrapRequest: Promise<void> | null = null;

    bootstrap() {
        if (typeof window === 'undefined') {
            this.enabled = false;
            return;
        }

        if (this.assetCheckState === 'ready' || this.assetCheckState === 'disabled' || this.bootstrapRequest) {
            return;
        }

        this.bootstrapRequest = this.verifyConfiguredAssets().finally(() => {
            this.bootstrapRequest = null;
        });
    }

    setEnabled(value: boolean) {
        this.enabled = value;
        if (!value) {
            this.disposeAll();
        }
    }

    private flushPendingActions() {
        if (!this.enabled || this.assetCheckState !== 'ready' || this.pendingActions.length === 0) {
            return;
        }

        const queuedActions = [...this.pendingActions];
        this.pendingActions = [];
        for (const action of queuedActions) {
            action();
        }
    }

    private runWhenReady(action: () => void) {
        if (!this.enabled) {
            return;
        }

        if (this.assetCheckState === 'ready') {
            action();
            return;
        }

        if (this.assetCheckState === 'pending') {
            this.pendingActions.push(action);
        }
    }

    private async assetResponseLooksUsable(path: string) {
        try {
            const response = await fetch(path, {
                cache: 'no-store',
                method: 'HEAD',
            });

            if (!response.ok) {
                return false;
            }

            const contentType = response.headers.get('content-type');
            return contentType ? contentType.startsWith('audio/') : true;
        } catch {
            return false;
        }
    }

    private async verifyConfiguredAssets() {
        const assetResults = await Promise.all(
            AUDIO_CUES.map(async (cue) => ({
                cue,
                valid: await this.assetResponseLooksUsable(AUDIO_ASSETS[cue]),
            })),
        );
        const missingRequiredAssets = assetResults.filter(
            (result) => !result.valid && !OPTIONAL_AUDIO_CUES.has(result.cue),
        );

        if (missingRequiredAssets.length > 0) {
            this.assetCheckState = 'disabled';
            this.pendingActions = [];
            this.setEnabled(false);
            console.warn('[athar:audio] AUDIO DISABLED: configured audio files are missing or unreadable');
            return;
        }

        for (const result of assetResults) {
            if (!result.valid && OPTIONAL_AUDIO_CUES.has(result.cue)) {
                this.unavailableCues.add(result.cue);
            }
        }

        this.assetCheckState = 'ready';
        this.flushPendingActions();
    }

    private disposeCue(cue: AudioCue) {
        const pendingStopTimeout = this.ambientStopTimeouts.get(cue);
        if (pendingStopTimeout !== undefined) {
            window.clearTimeout(pendingStopTimeout);
            this.ambientStopTimeouts.delete(cue);
        }

        const current = this.registry.get(cue);
        if (!current) {
            return;
        }

        current.howl.stop();
        current.loopActive = false;
        current.howl.unload();
        this.registry.delete(cue);

        if (this.ambientCue === cue) {
            this.ambientCue = null;
        }
    }

    private ensureCue(cue: AudioCue) {
        if (this.unavailableCues.has(cue)) {
            return null;
        }

        const existing = this.registry.get(cue);
        if (existing) {
            return existing;
        }

        const howl = new Howl({
            loop: LOOPING_CUES.has(cue),
            onload: () => {
                const current = this.registry.get(cue);
                if (current) {
                    current.ready = true;
                }
            },
            onloaderror: (_soundId, error) => {
                const current = this.registry.get(cue);
                if (current) {
                    current.howl.stop();
                    current.howl.unload();
                    this.registry.delete(cue);

                    if (this.ambientCue === cue) {
                        this.ambientCue = null;
                    }
                }

                this.unavailableCues.add(cue);
                console.warn(`[athar:audio] FAILED TO LOAD CUE "${cue}" and disabled it for this session`, error);
            },
            onplayerror: (_soundId, error) => {
                console.warn(`[athar:audio] FAILED TO PLAY CUE "${cue}"`, error);
            },
            preload: false,
            src: [AUDIO_ASSETS[cue]],
            volume: cue.startsWith('ambient')
                ? AMBIENT_VOLUME
                : cue === 'footsteps-walk'
                  ? FOOTSTEP_VOLUME
                  : DEFAULT_SFX_VOLUME,
        });

        const entry = {
            howl,
            loopActive: false,
            ready: false,
        };

        this.registry.set(cue, entry);
        return entry;
    }

    warmup(cues = GAMEPLAY_WARMUP_CUES) {
        this.runWhenReady(() => {
            for (const cue of cues) {
                const entry = this.ensureCue(cue);
                if (!entry || entry.ready) {
                    continue;
                }

                entry.howl.load();
            }
        });
    }

    play(cue: AudioCue) {
        this.runWhenReady(() => {
            const entry = this.ensureCue(cue);
            if (!entry) {
                return;
            }

            if (!entry.ready) {
                entry.howl.load();
            }

            entry.howl.play();
        });
    }

    setLoopActive(cue: AudioCue, active: boolean) {
        this.runWhenReady(() => {
            if (cue.startsWith('ambient')) {
                if (active) {
                    this.setAmbient(cue);
                } else if (this.ambientCue === cue) {
                    this.stopAmbient();
                }

                return;
            }

            const entry = this.ensureCue(cue);
            if (!entry || !LOOPING_CUES.has(cue)) {
                return;
            }

            if (active) {
                if (entry.loopActive) {
                    return;
                }

                if (!entry.ready) {
                    entry.howl.load();
                }

                entry.howl.play();
                entry.loopActive = true;
                return;
            }

            if (!entry.loopActive) {
                return;
            }

            entry.howl.stop();
            entry.loopActive = false;
        });
    }

    setAmbient(cue: AudioCue) {
        this.runWhenReady(() => {
            if (this.ambientCue === cue) {
                return;
            }

            const entry = this.ensureCue(cue);
            if (!entry) {
                return;
            }

            if (this.ambientCue) {
                const current = this.registry.get(this.ambientCue);
                if (current) {
                    const previousCue = this.ambientCue;
                    current.howl.fade(AMBIENT_VOLUME, 0, AMBIENT_FADE_OUT_MS);
                    const stopTimeoutId = window.setTimeout(() => {
                        current.howl.stop();
                        this.ambientStopTimeouts.delete(previousCue);
                    }, AMBIENT_FADE_OUT_MS);

                    this.ambientStopTimeouts.set(previousCue, stopTimeoutId);
                }
            }

            this.ambientCue = cue;

            const pendingStopTimeout = this.ambientStopTimeouts.get(cue);
            if (pendingStopTimeout !== undefined) {
                window.clearTimeout(pendingStopTimeout);
                this.ambientStopTimeouts.delete(cue);
            }

            if (!entry.ready) {
                entry.howl.load();
            }

            entry.howl.volume(0);
            entry.howl.play();
            entry.howl.fade(0, AMBIENT_VOLUME, AMBIENT_FADE_IN_MS);
        });
    }

    stopAmbient() {
        if (!this.ambientCue) {
            return;
        }

        this.disposeCue(this.ambientCue);
    }

    disposeAll() {
        for (const cue of [...this.registry.keys()]) {
            this.disposeCue(cue);
        }
    }
}

export const audioManager = new AtharAudioManager();
