export type MapRuntimeIssueCode = 'map-asset-failed' | 'webgl-context-lost';

export type MapRuntimeIssue = {
    blocking: boolean;
    code: MapRuntimeIssueCode;
    message: string;
    title: string;
};

export const createMapAssetRuntimeIssue = (message: string, blocking = false): MapRuntimeIssue => ({
    blocking,
    code: 'map-asset-failed',
    message,
    title: 'Map Assets Failed To Load',
});

export const createWebGlRuntimeIssue = (): MapRuntimeIssue => ({
    blocking: true,
    code: 'webgl-context-lost',
    message: 'Rendering paused after the browser lost the WebGL context. Retry rendering or reload the route.',
    title: 'Rendering Paused',
});
