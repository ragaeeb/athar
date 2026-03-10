import type { Coords, TokenState } from '@/content/levels/types';

export type TokenRenderGroup = {
    anchor: Coords;
    id: string;
    tokens: TokenState[];
};

export type TokenRenderGroups = {
    clusterGroups: TokenRenderGroup[];
    scatteredTokens: TokenState[];
};

export const buildTokenRenderGroups = (tokens: TokenState[]): TokenRenderGroups => {
    const clusterGroupsById = new Map<string, TokenRenderGroup>();
    const scatteredTokens: TokenState[] = [];

    for (const token of tokens) {
        if (token.collected) {
            continue;
        }

        if (token.kind !== 'cluster' || !token.clusterId) {
            scatteredTokens.push(token);
            continue;
        }

        const existing = clusterGroupsById.get(token.clusterId);
        if (existing) {
            existing.tokens.push(token);
            continue;
        }

        clusterGroupsById.set(token.clusterId, {
            anchor: token.anchor,
            id: token.clusterId,
            tokens: [token],
        });
    }

    return {
        clusterGroups: [...clusterGroupsById.values()],
        scatteredTokens,
    };
};
