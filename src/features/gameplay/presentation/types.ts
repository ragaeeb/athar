import type { Group } from 'three';
import type { Coords } from '@/content/levels/types';
import type { SimulationStepResult } from '@/features/gameplay/simulation/core/SimulationTypes';

export type SceneEntityId = string;

export type SceneEntityPresentationState = {
    dirty: boolean;
    lastCoords: Coords | null;
    targetPosition: { x: number; y: number; z: number } | null;
};

export type SceneRegistry = {
    clear: () => void;
    getEntityRef: (id: SceneEntityId) => Group | null;
    getPresentationState: (id: SceneEntityId) => SceneEntityPresentationState;
    markDirty: (id: SceneEntityId) => void;
    registerEntity: (id: SceneEntityId, ref: Group) => void;
    unregisterEntity: (id: SceneEntityId, ref?: Group | null) => void;
};

export type RendererBridge = {
    consume: (result: SimulationStepResult) => void;
};
