import { DoubleSide, MeshBasicMaterial, MeshStandardMaterial, Texture } from 'three';
import { describe, expect, it } from 'vitest';
import { prepareGLTFMaterials } from '@/shared/three/gltf-materials';

describe('prepareGLTFMaterials', () => {
    it('converts transparent authored materials into cutout unlit materials for buildings', () => {
        const map = new Texture();
        const alphaMap = new Texture();
        const source = new MeshStandardMaterial({
            alphaMap,
            alphaTest: 0.1,
            color: '#ffffff',
            map,
            side: DoubleSide,
            transparent: true,
        });

        const prepared = prepareGLTFMaterials(source, {
            materialMode: 'unlit',
        });

        expect(prepared).toBeInstanceOf(MeshBasicMaterial);

        const material = prepared as MeshBasicMaterial;
        expect(material).not.toBe(source);
        expect(material.map).toBe(map);
        expect(material.alphaMap).toBe(alphaMap);
        expect(material.transparent).toBe(false);
        expect(material.depthWrite).toBe(true);
        expect(material.alphaTest).toBeCloseTo(0.35, 5);
        expect(material.side).toBe(DoubleSide);
    });

    it('clones authored lit materials without mutating the source material', () => {
        const source = new MeshStandardMaterial({
            color: '#777777',
        });
        source.envMapIntensity = 0.2;

        const prepared = prepareGLTFMaterials(source, {
            materialCustomizer: (material) => {
                material.color.set('#ff0000');
            },
        });

        expect(prepared).toBeInstanceOf(MeshStandardMaterial);

        const material = prepared as MeshStandardMaterial;
        expect(material).not.toBe(source);
        expect(source.color.getHexString()).toBe('777777');
        expect(material.color.getHexString()).toBe('ff0000');
        expect(source.envMapIntensity).toBeCloseTo(0.2, 5);
        expect(material.envMapIntensity).toBeCloseTo(0.7, 5);
    });

    it('reuses converted materials when a cache is provided', () => {
        const source = new MeshStandardMaterial({
            color: '#ffffff',
        });
        const materialCache = new Map();

        const first = prepareGLTFMaterials(source, {
            materialCache,
            materialMode: 'unlit',
        });
        const second = prepareGLTFMaterials(source, {
            materialCache,
            materialMode: 'unlit',
        });

        expect(first).toBe(second);
    });
});
