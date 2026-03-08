import { Group } from 'three';
import { describe, expect, it } from 'vitest';

import { createSceneRegistry } from '@/features/gameplay/presentation/SceneRegistry';

describe('SceneRegistry', () => {
    it('keeps the latest entity ref when stale cleanup runs later', () => {
        const registry = createSceneRegistry();
        const firstRef = new Group();
        const secondRef = new Group();

        registry.registerEntity('player', firstRef);
        registry.registerEntity('player', secondRef);
        registry.unregisterEntity('player', firstRef);

        expect(registry.getEntityRef('player')).toBe(secondRef);

        registry.unregisterEntity('player', secondRef);

        expect(registry.getEntityRef('player')).toBeNull();
    });

    it('marks presentation state dirty when an entity is re-registered', () => {
        const registry = createSceneRegistry();
        const ref = new Group();

        registry.registerEntity('player', ref);
        const presentationState = registry.getPresentationState('player');
        presentationState.dirty = false;

        registry.registerEntity('player', ref);

        expect(registry.getEntityRef('player')).toBe(ref);
        expect(registry.getPresentationState('player').dirty).toBe(true);
    });
});
