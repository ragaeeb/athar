// Re-export shim. The canonical implementation lives under simulation/systems/.
// Keep gameplay imports pointed here when a feature module expects the historical systems path.
export {
    findCollectableTokens,
    findReachedMilestone,
    findTeacherEncounter,
    findTriggeredObstacle,
    isMilestoneObjective,
    isTeacherObjective,
    meetsWinCondition,
    resolveNextObjective,
} from '@/features/gameplay/simulation/systems/CollisionSystem';
