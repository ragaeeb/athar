import { Color, MeshBasicMaterial, SRGBColorSpace } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('GLTFPBRSpecGlossinessFallbackExtension', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let warnMessages: string[] = [];

    beforeEach(() => {
        warnMessages = [];
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation((message: unknown) => {
            warnMessages.push(String(message));
        });
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
        vi.resetModules();
    });

    it('maps spec-gloss diffuse textures onto a basic material fallback', async () => {
        const { GLTFPBRSpecGlossinessFallbackExtension } = await import('@/shared/three/gltf-loader-extensions');
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
        const materialParams: Record<string, unknown> = {
            metalness: 0.3,
            roughness: 0.7,
        };

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
        expect(materialParams).not.toHaveProperty('metalness');
        expect(materialParams).not.toHaveProperty('roughness');
        expect(warnMessages).toEqual(['THREE.WARNING: Multiple instances of Three.js being imported.']);
    });

    it('does nothing for materials without the spec-gloss extension', async () => {
        const { GLTFPBRSpecGlossinessFallbackExtension } = await import('@/shared/three/gltf-loader-extensions');
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
        expect(warnMessages).toEqual([]);
    });
});

describe('GLTF source registry lifecycle', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        vi.unmock('@react-three/drei');
        vi.unmock('@/shared/three/gltf-scene-model-utils');
    });

    it('evicts the most recently registered source scene for a model path', async () => {
        const clearMock = vi.fn();
        const disposeSourceSceneMock = vi.fn();

        vi.doMock('@react-three/drei', () => ({
            useGLTF: {
                clear: clearMock,
                preload: vi.fn(),
            },
        }));
        vi.doMock('@/shared/three/gltf-scene-model-utils', () => ({
            disposeGLTFSourceScene: disposeSourceSceneMock,
        }));

        const { evictGLTFSceneModel, registerGLTFSceneModelSource } = await import(
            '@/shared/three/gltf-loader-extensions'
        );

        const firstScene = { traverse: vi.fn() } as unknown as import('three').Object3D;
        const secondScene = { traverse: vi.fn() } as unknown as import('three').Object3D;

        registerGLTFSceneModelSource('/models/test.glb', firstScene);
        registerGLTFSceneModelSource('/models/test.glb', secondScene);

        evictGLTFSceneModel('/models/test.glb');
        expect(disposeSourceSceneMock).toHaveBeenCalledTimes(1);
        expect(disposeSourceSceneMock).toHaveBeenCalledWith(secondScene);
        expect(clearMock).toHaveBeenCalledWith('/models/test.glb');

        evictGLTFSceneModel('/models/test.glb');
        expect(disposeSourceSceneMock).toHaveBeenCalledTimes(1);
        expect(clearMock).toHaveBeenCalledTimes(2);
    });

    it('clears cached GLTF data before preloading with the loader extension hook', async () => {
        const clearMock = vi.fn();
        const preloadMock = vi.fn();

        vi.doMock('@react-three/drei', () => ({
            useGLTF: {
                clear: clearMock,
                preload: preloadMock,
            },
        }));
        vi.doMock('@/shared/three/gltf-scene-model-utils', () => ({
            disposeGLTFSourceScene: vi.fn(),
        }));

        const { preloadGLTFSceneModel } = await import('@/shared/three/gltf-loader-extensions');

        preloadGLTFSceneModel('/models/guard.glb');

        expect(clearMock).toHaveBeenCalledWith('/models/guard.glb');
        expect(preloadMock).toHaveBeenCalledTimes(1);
        expect(preloadMock).toHaveBeenCalledWith('/models/guard.glb', true, true, expect.any(Function));
    });
});
