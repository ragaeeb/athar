import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { scanContentGovernanceEntries, scanContentGovernanceRoot } from './check-content-governance.mjs';

const fixturesRoot = join(process.cwd(), 'scripts/fixtures/content-governance');

describe('check-content-governance', () => {
    it('passes clean editorial content fixtures', () => {
        const violations = scanContentGovernanceRoot(`${fixturesRoot}/pass/src/content`);

        expect(violations).toEqual([]);
    });

    it('flags placeholders in authored content and chapter-specific framing in shared registries', () => {
        const violations = scanContentGovernanceRoot(`${fixturesRoot}/fail/src/content`);

        expect(
            violations.map((violation) => `${violation.message}:${violation.snippet}`),
        ).toEqual(
            expect.arrayContaining([
                'todo marker:TODO',
                'placeholder marker:Placeholder',
                'chapter-specific framing:chapter',
                'route-specific framing:route',
                'role-framing language:used here as',
                'role-framing language:finale teacher',
            ]),
        );
    });

    it('only applies chapter and route framing checks to the shared scholar registry', () => {
        const violations = scanContentGovernanceEntries([
            {
                filePath: '/virtual/src/content/levels/level-2/config.ts',
                source: "export const note = 'This chapter route stays in level content where it belongs.';",
            },
        ]);

        expect(violations).toEqual([]);
    });
});
