import type { SimulationPlayerState } from '@/features/gameplay/simulation/core/SimulationTypes';

export const shouldPlayTeacherEncounterAudio = (
    previousPlayer: Pick<SimulationPlayerState, 'activeTeacher' | 'dialogueOpen'>,
    nextPlayer: Pick<SimulationPlayerState, 'activeTeacher' | 'dialogueOpen'>,
) => !previousPlayer.dialogueOpen && nextPlayer.dialogueOpen && nextPlayer.activeTeacher !== null;
