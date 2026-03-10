import { describe, expect, it } from 'vitest';
import { LEVEL_REGISTRY, LEVEL_REGISTRY_DIAGNOSTICS } from '@/content/levels/registry';

describe('level registry', () => {
    it('validates every authored level without diagnostics', () => {
        expect(LEVEL_REGISTRY_DIAGNOSTICS).toEqual([]);
        expect(LEVEL_REGISTRY.map((level) => level.id)).toEqual([
            'level-1',
            'level-2',
            'level-3',
            'level-4',
            'level-5',
        ]);
    });
});
