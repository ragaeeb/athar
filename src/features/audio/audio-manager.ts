import { Howl } from 'howler';

import { AUDIO_ASSETS, type AudioCue } from '@/content/audio/cues';

type AudioEntry = {
    howl: Howl;
    ready: boolean;
    failed: boolean;
};

class AtharAudioManager {
    private registry = new Map<AudioCue, AudioEntry>();

    private ambientCue: AudioCue | null = null;

    private enabled = true;

    bootstrap() {
        if (typeof window === 'undefined') {
            this.enabled = false;
            return;
        }
    }

    setEnabled(value: boolean) {
        this.enabled = value;
        if (!value) {
            for (const { howl } of this.registry.values()) {
                howl.stop();
            }
            this.ambientCue = null;
        }
    }

    private ensureCue(cue: AudioCue) {
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
            onloaderror: () => {
                const current = this.registry.get(cue);
                if (current) {
                    current.failed = true;
                }
            },
            preload: false,
            src: [AUDIO_ASSETS[cue]],
            volume: cue.startsWith('ambient') ? 0.35 : 0.8,
        });

        const entry = {
            failed: false,
            howl,
            ready: false,
        };

        this.registry.set(cue, entry);
        return entry;
    }

    play(cue: AudioCue) {
        if (!this.enabled) {
            return;
        }

        const entry = this.ensureCue(cue);
        if (entry.failed) {
            return;
        }

        entry.howl.load();
        entry.howl.play();
    }

    setAmbient(cue: AudioCue) {
        if (!this.enabled || this.ambientCue === cue) {
            return;
        }

        if (this.ambientCue) {
            const current = this.registry.get(this.ambientCue);
            current?.howl.stop();
        }

        this.ambientCue = cue;
        const entry = this.ensureCue(cue);
        if (entry.failed) {
            return;
        }

        entry.howl.load();
        entry.howl.play();
    }

    stopAmbient() {
        if (!this.ambientCue) {
            return;
        }

        const current = this.registry.get(this.ambientCue);
        current?.howl.stop();
        this.ambientCue = null;
    }
}

export const audioManager = new AtharAudioManager();
