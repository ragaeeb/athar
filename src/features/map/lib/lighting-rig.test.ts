import { describe, expect, it } from 'vitest';

import { level2 } from '@/content/levels/level-2/config';
import { level4 } from '@/content/levels/level-4/config';
import { resolveLevelLightingRig } from '@/features/map/lib/lighting-rig';

describe('resolveLevelLightingRig', () => {
    it('uses a brighter city/day rig for the Hijaz morning chapter', () => {
        const rig = resolveLevelLightingRig(level2);

        expect(rig.environmentPreset).toBe('city');
        expect(rig.directionalIntensity).toBeGreaterThan(rig.ambientIntensity);
        expect(rig.sunPosition[1]).toBeGreaterThan(20);
    });

    it('uses the authored dusk rig for the eastern survival chapter', () => {
        const rig = resolveLevelLightingRig(level4);

        expect(rig.environmentPreset).toBe('sunset');
        expect(rig.directionalColor).toBe('#ffbf87');
        expect(rig.directionalIntensity).toBeLessThan(Math.PI);
    });

    it('falls back to the park daytime preset outside city ambience', () => {
        const rig = resolveLevelLightingRig({
            ambientCue: 'ambient-desert',
            lighting: {
                hour: 12,
                label: 'Noon',
                minute: 0,
            },
            origin: level2.origin,
        });

        expect(rig.environmentPreset).toBe('park');
        expect(rig.directionalIntensity).toBe(1.26 * Math.PI);
        expect(rig.ambientIntensity).toBe(0.78 * Math.PI);
        expect(rig.sunPosition).toHaveLength(3);
    });
});
