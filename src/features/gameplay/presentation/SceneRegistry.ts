import type { Group } from 'three';
import type {
    SceneEntityId,
    SceneEntityPresentationState,
    SceneRegistry,
} from '@/features/gameplay/presentation/types';

const createPresentationState = (): SceneEntityPresentationState => ({
    dirty: true,
    lastCoords: null,
    targetPosition: null,
});

export const createSceneRegistry = (): SceneRegistry => {
    const entityRefs = new Map<SceneEntityId, Group>();
    const presentationStates = new Map<SceneEntityId, SceneEntityPresentationState>();

    const getPresentationState = (id: SceneEntityId) => {
        let state = presentationStates.get(id);
        if (!state) {
            state = createPresentationState();
            presentationStates.set(id, state);
        }

        return state;
    };

    return {
        clear: () => {
            entityRefs.clear();
            presentationStates.clear();
        },
        getEntityRef: (id) => entityRefs.get(id) ?? null,
        getPresentationState,
        markDirty: (id) => {
            getPresentationState(id).dirty = true;
        },
        registerEntity: (id, ref) => {
            entityRefs.set(id, ref);
            getPresentationState(id).dirty = true;
        },
        unregisterEntity: (id, ref) => {
            const current = entityRefs.get(id);
            if (!current) {
                return;
            }

            if (ref && current !== ref) {
                return;
            }

            entityRefs.delete(id);
            presentationStates.delete(id);
        },
    };
};

export const sceneRegistry = createSceneRegistry();
