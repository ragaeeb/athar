import { Color, MeshBasicMaterial, SRGBColorSpace } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { GLTFPBRSpecGlossinessFallbackExtension } from '@/shared/three/gltf-loader-extensions';

describe('GLTFPBRSpecGlossinessFallbackExtension', () => {
    it('maps spec-gloss diffuse textures onto a basic material fallback', async () => {
        const assignTexture = vi.fn().mockResolvedValue(undefined);
        const parser = {
            assignTexture,
            json: {
                materials: [
                    {
                        extensions: {
                            KHR_materials_pbrSpecularGlossiness: {
                                diffuseFactor: [0.5, 0.25, 0.1, 0.8],
                                diffuseTexture: {
                                    index: 6,
                                },
                            },
                        },
                    },
                ],
            },
        };

        const extension = new GLTFPBRSpecGlossinessFallbackExtension(parser);
        const materialParams: Record<string, unknown> = {};

        expect(extension.getMaterialType(0)).toBe(MeshBasicMaterial);

        await extension.extendMaterialParams(0, materialParams);

        expect(assignTexture).toHaveBeenCalledWith(
            materialParams,
            'map',
            {
                index: 6,
            },
            SRGBColorSpace,
        );
        expect(materialParams.opacity).toBeCloseTo(0.8, 5);
        expect(materialParams.color).toBeInstanceOf(Color);
    });

    it('does nothing for materials without the spec-gloss extension', async () => {
        const assignTexture = vi.fn().mockResolvedValue(undefined);
        const parser = {
            assignTexture,
            json: {
                materials: [{}],
            },
        };

        const extension = new GLTFPBRSpecGlossinessFallbackExtension(parser);
        const materialParams: Record<string, unknown> = {};

        expect(extension.getMaterialType(0)).toBeNull();
        await extension.extendMaterialParams(0, materialParams);
        expect(assignTexture).not.toHaveBeenCalled();
        expect(materialParams).toEqual({});
    });
});
