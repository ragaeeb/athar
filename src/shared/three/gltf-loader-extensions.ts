import { useGLTF } from '@react-three/drei';
import { Color, LinearSRGBColorSpace, MeshBasicMaterial, SRGBColorSpace } from 'three';
import type { GLTFLoader, GLTFLoaderPlugin, GLTFParser } from 'three-stdlib';

const PBR_SPEC_GLOSS_EXTENSION = 'KHR_materials_pbrSpecularGlossiness';
const LOADER_PATCH_FLAG = '__atharPbrSpecGlossExtensionRegistered';

type GLTFTextureInfo = {
    index: number;
};

type GLTFSpecGlossExtensionData = {
    diffuseFactor?: [number, number, number, number];
    diffuseTexture?: GLTFTextureInfo;
};

type GLTFMaterialDefinition = {
    extensions?: Record<string, unknown>;
};

type GLTFParserLike = Pick<GLTFParser, 'assignTexture' | 'json'>;

type GLTFLoaderLike = Pick<GLTFLoader, 'register'> & {
    [LOADER_PATCH_FLAG]?: boolean;
};

type GLTFNamedLoaderPlugin = GLTFLoaderPlugin & {
    name: string;
};

type GLTFTextureAssigningParser = {
    assignTexture: (
        materialParams: Record<string, unknown>,
        mapName: string,
        mapDef: GLTFTextureInfo,
        colorSpace?: string,
    ) => Promise<void>;
    json: {
        materials?: GLTFMaterialDefinition[];
    };
};

const getSpecGlossExtension = (parser: GLTFParserLike, materialIndex: number) => {
    const material = parser.json.materials?.[materialIndex];
    const extension = material?.extensions?.[PBR_SPEC_GLOSS_EXTENSION];

    if (typeof extension !== 'object' || extension === null) {
        return null;
    }

    return extension as GLTFSpecGlossExtensionData;
};

class GLTFPBRSpecGlossinessFallbackExtension implements GLTFNamedLoaderPlugin {
    parser: GLTFTextureAssigningParser;
    name = PBR_SPEC_GLOSS_EXTENSION;

    constructor(parser: GLTFTextureAssigningParser) {
        this.parser = parser;
    }

    getMaterialType(materialIndex: number) {
        return getSpecGlossExtension(this.parser, materialIndex) ? MeshBasicMaterial : null;
    }

    extendMaterialParams(materialIndex: number, materialParams: Record<string, unknown>) {
        const extension = getSpecGlossExtension(this.parser, materialIndex);
        if (extension === null) {
            return Promise.resolve();
        }

        materialParams.color = new Color(1, 1, 1);
        materialParams.opacity = 1;

        if (Array.isArray(extension.diffuseFactor)) {
            const [r, g, b, a] = extension.diffuseFactor;
            (materialParams.color as Color).setRGB(r, g, b, LinearSRGBColorSpace);
            materialParams.opacity = a;
        }

        if (extension.diffuseTexture) {
            return this.parser.assignTexture(materialParams, 'map', extension.diffuseTexture, SRGBColorSpace);
        }

        return Promise.resolve();
    }
}

export const extendGLTFSceneLoader = (loader: GLTFLoaderLike) => {
    if (loader[LOADER_PATCH_FLAG]) {
        return;
    }

    loader.register((parser) => new GLTFPBRSpecGlossinessFallbackExtension(parser));
    loader[LOADER_PATCH_FLAG] = true;
};

export const preloadGLTFSceneModel = (modelPath: string) => {
    useGLTF.clear(modelPath);
    useGLTF.preload(modelPath, true, true, extendGLTFSceneLoader);
};

export { GLTFPBRSpecGlossinessFallbackExtension };
