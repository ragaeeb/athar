import { describe, expect, it } from 'vitest';

import type { TokenState } from '@/content/levels/types';
import { buildTokenRenderGroups } from '@/features/tokens/lib/token-render-groups';

const createToken = (overrides: Partial<TokenState>): TokenState => ({
    anchor: { lat: 0, lng: 0 },
    bounceSeed: 1,
    clusterId: null,
    collected: false,
    coords: { lat: 0, lng: 0 },
    expiresAt: null,
    id: 'token',
    kind: 'cluster',
    localOffsetMeters: { x: 0, z: 0 },
    value: 1,
    ...overrides,
});

describe('token-render-groups', () => {
    it('groups visible cluster tokens by cluster id and separates scattered tokens', () => {
        const groups = buildTokenRenderGroups([
            createToken({ clusterId: 'cluster-a', id: 'a-1', kind: 'cluster' }),
            createToken({ clusterId: 'cluster-a', id: 'a-2', kind: 'cluster' }),
            createToken({ clusterId: 'cluster-b', id: 'b-1', kind: 'cluster' }),
            createToken({ id: 's-1', kind: 'scattered' }),
        ]);

        expect(groups.clusterGroups).toHaveLength(2);
        expect(groups.clusterGroups.find((group) => group.id === 'cluster-a')?.tokens).toHaveLength(2);
        expect(groups.scatteredTokens.map((token) => token.id)).toEqual(['s-1']);
    });

    it('drops collected tokens from render groups', () => {
        const groups = buildTokenRenderGroups([
            createToken({ clusterId: 'cluster-a', collected: true, id: 'hidden' }),
            createToken({ id: 'visible', kind: 'scattered' }),
        ]);

        expect(groups.clusterGroups).toHaveLength(0);
        expect(groups.scatteredTokens.map((token) => token.id)).toEqual(['visible']);
    });
});
