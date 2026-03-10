export const AUDIO_ASSETS = {
    'ambient-city': '/audio/ambient/ambient-city.mp3',
    'ambient-desert': '/audio/ambient/ambient-desert.mp3',
    'collect-token': '/audio/sfx/collect-token.mp3',
    'footsteps-walk': '/audio/sfx/footsteps-walk.mp3',
    'level-complete': '/audio/ui/level-complete.mp3',
    'lose-token': '/audio/sfx/lose-token.mp3',
    'obstacle-hit': '/audio/sfx/obstacle-hit.mp3',
    'receive-hadith': '/audio/ui/receive-hadith.mp3',
    'teacher-encounter': '/audio/ui/teacher-encounter.mp3',
} as const;

export type AudioCue = keyof typeof AUDIO_ASSETS;
export type AmbientAudioCue = Extract<AudioCue, `ambient-${string}`>;

const ambientAudioCues = Object.keys(AUDIO_ASSETS).filter((cue): cue is AmbientAudioCue => cue.startsWith('ambient-'));

if (ambientAudioCues.length === 0) {
    throw new Error('Athar audio configuration must include at least one ambient cue.');
}

export const AMBIENT_AUDIO_CUES = ambientAudioCues as [AmbientAudioCue, ...AmbientAudioCue[]];
