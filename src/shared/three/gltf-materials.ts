import {
    type Color,
    type Material,
    MeshBasicMaterial,
    MeshPhongMaterial,
    MeshStandardMaterial,
    SRGBColorSpace,
} from 'three';

export type GLTFSceneMaterialCustomizer = (material: MeshStandardMaterial) => void;

export type GLTFSceneMaterialMode = 'authored' | 'unlit';

type PrepareGLTFMaterialOptions = {
    materialCache?: Map<Material, Material>;
    materialCustomizer?: GLTFSceneMaterialCustomizer | undefined;
    materialMode?: GLTFSceneMaterialMode | undefined;
};

const CUTOUT_ALPHA_TEST = 0.35;

const normalizeTextureColorSpace = (material: MeshBasicMaterial | MeshPhongMaterial | MeshStandardMaterial) => {
    if (material.map) {
        material.map.colorSpace = SRGBColorSpace;
    }

    if (material instanceof MeshPhongMaterial || material instanceof MeshStandardMaterial) {
        if (material.emissiveMap) {
            material.emissiveMap.colorSpace = SRGBColorSpace;
        }
    }
};

const isNeutralGray = (color: Color) =>
    Math.abs(color.r - color.g) < 0.01 && Math.abs(color.g - color.b) < 0.01 && color.r > 0.35 && color.r < 0.65;

const normalizeStaticMaterial = (material: MeshStandardMaterial, materialCustomizer?: GLTFSceneMaterialCustomizer) => {
    normalizeTextureColorSpace(material);

    if (material.transparent) {
        material.depthWrite = false;
        material.alphaTest = Math.max(material.alphaTest, CUTOUT_ALPHA_TEST);
    }

    if (!material.map && isNeutralGray(material.color)) {
        material.color.setRGB(0.9, 0.86, 0.8);
    }

    materialCustomizer?.(material);
    material.envMapIntensity = Math.max(material.envMapIntensity, 0.7);
    material.needsUpdate = true;
};

const normalizeLegacyMaterial = (material: MeshPhongMaterial) => {
    normalizeTextureColorSpace(material);

    if (material.transparent) {
        material.depthWrite = false;
        material.alphaTest = Math.max(material.alphaTest, CUTOUT_ALPHA_TEST);
    }

    if (material.map && isNeutralGray(material.color)) {
        material.color.setRGB(1, 1, 1);
    }

    material.needsUpdate = true;
};

const createUnlitMaterial = (material: Material) => {
    if (
        !(material instanceof MeshStandardMaterial) &&
        !(material instanceof MeshPhongMaterial) &&
        !(material instanceof MeshBasicMaterial)
    ) {
        return material.clone();
    }

    const unlitMaterial = new MeshBasicMaterial({
        alphaMap: material.alphaMap ?? null,
        color: material.color.clone(),
        fog: material.fog,
        map: material.map ?? null,
        name: material.name,
        opacity: material.opacity,
        side: material.side,
        vertexColors: material.vertexColors,
    });

    normalizeTextureColorSpace(unlitMaterial);

    const usesCutoutAlpha = material.transparent || Boolean(material.alphaMap) || material.alphaTest > 0;

    if (usesCutoutAlpha) {
        unlitMaterial.alphaTest = Math.max(material.alphaTest, CUTOUT_ALPHA_TEST);
        unlitMaterial.depthWrite = true;
        unlitMaterial.transparent = false;
    } else {
        unlitMaterial.depthWrite = true;
        unlitMaterial.transparent = material.transparent;
    }

    unlitMaterial.needsUpdate = true;

    return unlitMaterial;
};

const prepareSingleMaterial = (
    sourceMaterial: Material,
    { materialCache, materialCustomizer, materialMode = 'authored' }: PrepareGLTFMaterialOptions,
) => {
    const cachedMaterial = materialCache?.get(sourceMaterial);
    if (cachedMaterial) {
        return cachedMaterial;
    }

    let nextMaterial: Material;

    if (materialMode === 'unlit') {
        nextMaterial = createUnlitMaterial(sourceMaterial);
    } else if (sourceMaterial instanceof MeshStandardMaterial) {
        const clonedMaterial = sourceMaterial.clone() as MeshStandardMaterial;
        normalizeStaticMaterial(clonedMaterial, materialCustomizer);
        nextMaterial = clonedMaterial;
    } else if (sourceMaterial instanceof MeshPhongMaterial) {
        const clonedMaterial = sourceMaterial.clone() as MeshPhongMaterial;
        normalizeLegacyMaterial(clonedMaterial);
        nextMaterial = clonedMaterial;
    } else if (sourceMaterial instanceof MeshBasicMaterial) {
        const clonedMaterial = sourceMaterial.clone() as MeshBasicMaterial;
        normalizeTextureColorSpace(clonedMaterial);
        clonedMaterial.needsUpdate = true;
        nextMaterial = clonedMaterial;
    } else {
        nextMaterial = sourceMaterial.clone();
    }

    materialCache?.set(sourceMaterial, nextMaterial);

    return nextMaterial;
};

export const prepareGLTFMaterials = (
    materials: Material | Material[],
    options: PrepareGLTFMaterialOptions = {},
): Material | Material[] =>
    Array.isArray(materials)
        ? materials.map((material) => prepareSingleMaterial(material, options))
        : prepareSingleMaterial(materials, options);
