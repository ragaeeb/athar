import type { AudioCue } from '@/content/audio/cues';
import type {
    LevelConfig,
    NextObjective,
    ObjectiveStatus,
    ObstacleType,
    TeacherConfig,
    TokenState,
} from '@/content/levels/types';

export type SimulationCharacterModifiers = {
    guardLossMultiplier: number;
    obstacleDamageMultiplier: number;
    rivalLossMultiplier: number;
    scrambleDurationMultiplier: number;
    speedMultiplier: number;
    tokenRadiusMultiplier: number;
};

export type SimulationInputState = {
    moveX: number;
    moveZ: number;
};

export type SimulationPlayerState = {
    activeTeacher: TeacherConfig | null;
    bearing: number;
    coords: { lat: number; lng: number };
    dialogueOpen: boolean;
    hadithTokens: number;
    hitTokens: TokenState[];
    isHit: boolean;
    lastHitAt: number;
    positionMeters: { x: number; z: number };
    scrambleUntil: number;
    speed: number;
    tokensLost: number;
};

export type SimulationLevelState = {
    completedMilestoneIds: string[];
    completedTeacherIds: string[];
    isComplete: boolean;
    lockedHadith: number;
    nextObjective: NextObjective;
    objectives: ObjectiveStatus[];
    tokens: TokenState[];
};

export type SimulationState = {
    character: SimulationCharacterModifiers;
    level: LevelConfig;
    levelState: SimulationLevelState;
    nowMs: number;
    player: SimulationPlayerState;
};

export type SimulationEvent =
    | { type: 'audio'; cue: AudioCue }
    | {
          type: 'hazard-triggered';
          effect: 'confiscate' | 'kill' | 'scatter' | 'scramble' | 'steal' | 'wash';
          lostCount: number;
          obstacleId: string;
          obstacleLabel: string;
          obstacleType: ObstacleType;
          recoverableCount: number;
          scrambleDurationMs: number;
      }
    | { type: 'dialogue-opened'; teacher: TeacherConfig }
    | { type: 'milestone-completed'; milestoneId: string }
    | { type: 'objective-updated'; objective: NextObjective }
    | { type: 'player-defeated'; obstacleId: string; obstacleLabel: string; obstacleType: ObstacleType }
    | { type: 'player-hit'; lostCount: number }
    | { type: 'player-moved' }
    | { type: 'teacher-ready'; teacherId: string }
    | { type: 'token-collected'; tokenId: string; value: number }
    | { type: 'chapter-complete' };

export type SimulationStepInput = {
    deltaMs: number;
    input: SimulationInputState;
    state: SimulationState;
};

export type SimulationStepResult = {
    events: SimulationEvent[];
    state: SimulationState;
};

export type SimulationAdvanceInput = {
    frameDeltaMs: number;
    input: SimulationInputState;
    state: SimulationState;
};

export type SimulationAdvanceResult = {
    accumulatorMs: number;
    didStep: boolean;
    events: SimulationEvent[];
    state: SimulationState;
};
