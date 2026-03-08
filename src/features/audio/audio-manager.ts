import { Howl } from 'howler';

import { AUDIO_ASSETS, type AudioCue } from '@/content/audio/cues';

type AudioEntry = {
    howl: Howl;
    ready: boolean;
};

const GAMEPLAY_WARMUP_CUES = (Object.keys(AUDIO_ASSETS) as AudioCue[]).filter((cue) => !cue.startsWith('ambient'));
const AUDIO_CUES = Object.keys(AUDIO_ASSETS) as AudioCue[];

class AtharAudioManager {
    private registry = new Map<AudioCue, AudioEntry>();

    private unavailableCues = new Set<AudioCue>();

    private assetCheckState: 'pending' | 'ready' | 'disabled' = 'pending';

    private pendingActions: Array<() => void> = [];

    private ambientCue: AudioCue | null = null;

    private enabled = true;

    bootstrap() {
        if (typeof window === 'undefined') {
            this.enabled = false;
            return;
        }

        void this.verifyConfiguredAssets();
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
        const hasAllAssets = (
            await Promise.all(AUDIO_CUES.map((cue) => this.assetResponseLooksUsable(AUDIO_ASSETS[cue])))
        ).every(Boolean);

        if (!hasAllAssets) {
            this.assetCheckState = 'disabled';
            this.pendingActions = [];
            this.setEnabled(false);
            console.warn('[athar:audio] AUDIO DISABLED: configured audio files are missing or unreadable');
            return;
        }

        this.assetCheckState = 'ready';
        this.flushPendingActions();
    }

    private disposeCue(cue: AudioCue) {
        const current = this.registry.get(cue);
        if (!current) {
            return;
        }

        current.howl.stop();
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
            loop: cue.startsWith('ambient'),
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
            volume: cue.startsWith('ambient') ? 0.35 : 0.8,
        });

        const entry = {
            howl,
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

    setAmbient(cue: AudioCue) {
        this.runWhenReady(() => {
            if (this.ambientCue === cue) {
                return;
            }

            if (this.ambientCue) {
                const current = this.registry.get(this.ambientCue);
                current?.howl.stop();
            }

            this.ambientCue = cue;
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
