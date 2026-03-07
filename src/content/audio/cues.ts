export type AudioCue =
    | 'ambient-desert'
    | 'ambient-city'
    | 'collect-token'
    | 'lose-token'
    | 'teacher-encounter'
    | 'receive-hadith'
    | 'obstacle-hit'
    | 'level-complete';

export const AUDIO_ASSETS: Record<AudioCue, string> = {
    'ambient-city': '/audio/ambient/ambient-city.mp3',
    'ambient-desert': '/audio/ambient/ambient-desert.mp3',
    'collect-token': '/audio/sfx/collect-token.mp3',
    'level-complete': '/audio/ui/level-complete.mp3',
    'lose-token': '/audio/sfx/lose-token.mp3',
    'obstacle-hit': '/audio/sfx/obstacle-hit.mp3',
    'receive-hadith': '/audio/ui/receive-hadith.mp3',
    'teacher-encounter': '/audio/ui/teacher-encounter.mp3',
};
