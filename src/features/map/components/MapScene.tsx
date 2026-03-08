import 'maplibre-gl/dist/maplibre-gl.css';

import { AdaptiveDpr, Environment } from '@react-three/drei';
import type { ErrorEvent, MapContextEvent } from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import MapLibreMap, { type MapRef } from 'react-map-gl/maplibre';
import { Canvas } from 'react-three-map/maplibre';
import { PCFShadowMap } from 'three';

import type { LevelConfig } from '@/content/levels/types';
import { atharDebugLog } from '@/features/debug/debug';
import {
    recordManualMapInteraction,
    setPerfMapViewController,
    updateMapViewSnapshot,
} from '@/features/debug/perf-metrics';
import { getSunLightPosition } from '@/features/map/lib/geo';
import {
    createMapAssetRuntimeIssue,
    createWebGlRuntimeIssue,
    type MapRuntimeIssue,
} from '@/features/map/lib/runtime-issues';

type MapSceneProps = {
    level: LevelConfig;
    children: React.ReactNode;
    onRuntimeIssueChange?: (issue: MapRuntimeIssue | null) => void;
};

export const MapScene = ({ level, children, onRuntimeIssueChange }: MapSceneProps) => {
    const sunPosition = getSunLightPosition(level.origin, level.lighting);
    const mapRef = useRef<MapRef | null>(null);
    const levelIdRef = useRef(level.id);
    const lastRuntimeIssueSignatureRef = useRef<string | null>(null);
    const onRuntimeIssueChangeRef = useRef(onRuntimeIssueChange);
    const fallbackMapViewRef = useRef({
        bearing: level.initialView.bearing,
        center: {
            lat: level.initialView.latitude,
            lng: level.initialView.longitude,
        },
        pitch: level.initialView.pitch,
        zoom: level.initialView.zoom,
    });
    const [mapLoaded, setMapLoaded] = useState(false);

    const getErrorDetails = useCallback((error: unknown): { message: string; type: string | null } => {
        const parseMessage = (value: string) => {
            try {
                const parsed = JSON.parse(value) as {
                    message?: unknown;
                    statusMessage?: unknown;
                    type?: unknown;
                };

                return {
                    message:
                        typeof parsed.statusMessage === 'string'
                            ? parsed.statusMessage
                            : typeof parsed.message === 'string'
                              ? parsed.message
                              : value,
                    type: typeof parsed.type === 'string' ? parsed.type : null,
                };
            } catch {
                return {
                    message: value,
                    type: null,
                };
            }
        };

        if (error instanceof Error) {
            return parseMessage(error.message);
        }

        if (typeof error === 'string') {
            return parseMessage(error);
        }

        if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
            const details = parseMessage(error.message);
            const errorWithOptionalType = error as { type?: unknown };

            return {
                message: details.message,
                type: typeof errorWithOptionalType.type === 'string' ? errorWithOptionalType.type : details.type,
            };
        }

        return {
            message: 'Map assets failed before the chapter finished loading.',
            type: null,
        };
    }, []);

    const updateRuntimeIssue = useCallback((issue: MapRuntimeIssue | null) => {
        const nextSignature = issue ? `${issue.code}:${issue.message}` : null;
        if (nextSignature === lastRuntimeIssueSignatureRef.current) {
            return;
        }

        lastRuntimeIssueSignatureRef.current = nextSignature;
        onRuntimeIssueChangeRef.current?.(issue);

        if (issue) {
            atharDebugLog('map', 'runtime-issue', {
                code: issue.code,
                levelId: levelIdRef.current,
                message: issue.message,
            });
            return;
        }

        atharDebugLog('map', 'runtime-recovered', { levelId: levelIdRef.current });
    }, []);

    useEffect(() => {
        levelIdRef.current = level.id;
    }, [level.id]);

    useEffect(() => {
        onRuntimeIssueChangeRef.current = onRuntimeIssueChange;
    }, [onRuntimeIssueChange]);

    useEffect(() => {
        lastRuntimeIssueSignatureRef.current = null;
        setMapLoaded(false);
        onRuntimeIssueChangeRef.current?.(null);
    }, [level.id]);

    useEffect(() => {
        const readFallbackMapView = () => fallbackMapViewRef.current;
        const applyFallbackMapView = (
            view: Partial<{ bearing: number; center: { lat: number; lng: number }; pitch: number; zoom: number }>,
            manual: boolean,
        ) => {
            if (manual) {
                recordManualMapInteraction();
            }

            fallbackMapViewRef.current = {
                bearing: view.bearing ?? fallbackMapViewRef.current.bearing,
                center: view.center ?? fallbackMapViewRef.current.center,
                pitch: view.pitch ?? fallbackMapViewRef.current.pitch,
                zoom: view.zoom ?? fallbackMapViewRef.current.zoom,
            };
            updateMapViewSnapshot(readFallbackMapView());
        };

        updateMapViewSnapshot(readFallbackMapView());
        setPerfMapViewController({
            getMapView: readFallbackMapView,
            jumpToMapView: (view) => {
                applyFallbackMapView(view, false);
            },
            setMapView: (view) => {
                applyFallbackMapView(view, true);
            },
        });

        return () => {
            setPerfMapViewController(null);
        };
    }, [level]);

    useEffect(() => {
        if (!mapLoaded || !mapRef.current) {
            return;
        }

        const map = mapRef.current.getMap();
        const readMapView = () => ({
            bearing: map.getBearing(),
            center: {
                lat: map.getCenter().lat,
                lng: map.getCenter().lng,
            },
            pitch: map.getPitch(),
            zoom: map.getZoom(),
        });
        const applyMapView = (
            view: Partial<{ bearing: number; center: { lat: number; lng: number }; pitch: number; zoom: number }>,
            manual: boolean,
        ) => {
            const current = readMapView();
            const nextView = {
                bearing: view.bearing ?? current.bearing ?? 0,
                center: view.center ?? current.center,
                pitch: view.pitch ?? current.pitch ?? 0,
                zoom: view.zoom ?? current.zoom ?? 0,
            };

            if (manual) {
                recordManualMapInteraction();
            }

            map.jumpTo({
                bearing: nextView.bearing,
                center: [nextView.center.lng, nextView.center.lat],
                pitch: nextView.pitch,
                zoom: nextView.zoom,
            });
            updateMapViewSnapshot(nextView);
        };
        const syncMapView = () => {
            updateMapViewSnapshot(readMapView());
        };
        const markManualInteraction = () => {
            recordManualMapInteraction();
            syncMapView();
        };

        map.scrollZoom.setZoomRate(1 / 20);
        map.scrollZoom.setWheelZoomRate(1 / 90);
        syncMapView();
        setPerfMapViewController({
            getMapView: readMapView,
            jumpToMapView: (view) => {
                applyMapView(view, false);
            },
            setMapView: (view) => {
                applyMapView(view, true);
            },
        });

        map.on('move', syncMapView);
        map.on('zoomstart', markManualInteraction);
        map.on('dragstart', markManualInteraction);
        map.on('rotatestart', markManualInteraction);
        map.on('pitchstart', markManualInteraction);

        return () => {
            setPerfMapViewController({
                getMapView: () => fallbackMapViewRef.current,
                jumpToMapView: (view) => {
                    fallbackMapViewRef.current = {
                        bearing: view.bearing ?? fallbackMapViewRef.current.bearing,
                        center: view.center ?? fallbackMapViewRef.current.center,
                        pitch: view.pitch ?? fallbackMapViewRef.current.pitch,
                        zoom: view.zoom ?? fallbackMapViewRef.current.zoom,
                    };
                    updateMapViewSnapshot(fallbackMapViewRef.current);
                },
                setMapView: (view) => {
                    recordManualMapInteraction();
                    fallbackMapViewRef.current = {
                        bearing: view.bearing ?? fallbackMapViewRef.current.bearing,
                        center: view.center ?? fallbackMapViewRef.current.center,
                        pitch: view.pitch ?? fallbackMapViewRef.current.pitch,
                        zoom: view.zoom ?? fallbackMapViewRef.current.zoom,
                    };
                    updateMapViewSnapshot(fallbackMapViewRef.current);
                },
            });
            map.off('move', syncMapView);
            map.off('zoomstart', markManualInteraction);
            map.off('dragstart', markManualInteraction);
            map.off('rotatestart', markManualInteraction);
            map.off('pitchstart', markManualInteraction);
        };
    }, [level, mapLoaded]);

    useEffect(() => {
        if (!mapLoaded || !mapRef.current) {
            return;
        }

        const map = mapRef.current.getMap();

        const handleMapError = (event: ErrorEvent) => {
            const details = getErrorDetails(event.error);
            updateRuntimeIssue(createMapAssetRuntimeIssue(details.message, false));
        };
        const handleContextLost = (_event: MapContextEvent) => {
            updateRuntimeIssue(createWebGlRuntimeIssue());
        };
        const handleContextRestored = (_event: MapContextEvent) => {
            updateRuntimeIssue(null);
        };

        map.on('error', handleMapError);
        map.on('webglcontextlost', handleContextLost);
        map.on('webglcontextrestored', handleContextRestored);

        return () => {
            map.off('error', handleMapError);
            map.off('webglcontextlost', handleContextLost);
            map.off('webglcontextrestored', handleContextRestored);
        };
    }, [getErrorDetails, mapLoaded, updateRuntimeIssue]);

    return (
        <MapLibreMap
            ref={mapRef}
            reuseMaps
            initialViewState={level.initialView}
            keyboard={false}
            onError={(event) => {
                const details = getErrorDetails(event.error);
                const blocking = !mapLoaded && details.type !== 'webglcontextcreationerror';
                updateRuntimeIssue(createMapAssetRuntimeIssue(details.message, blocking));
            }}
            onLoad={() => {
                setMapLoaded(true);
                updateRuntimeIssue(null);
            }}
            maxPitch={75}
            dragRotate
            scrollZoom={{ around: 'center' }}
            touchZoomRotate={{ around: 'center' }}
            style={{ height: '100%', width: '100%' }}
            mapStyle={level.mapStyle}
        >
            <Canvas
                latitude={level.origin.lat}
                longitude={level.origin.lng}
                shadows={{ type: PCFShadowMap }}
                frameloop="always"
            >
                <AdaptiveDpr pixelated />
                <ambientLight intensity={0.8 * Math.PI} />
                <directionalLight
                    castShadow
                    position={sunPosition}
                    intensity={1.3 * Math.PI}
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />
                <Environment preset="sunset" />
                {children}
            </Canvas>
        </MapLibreMap>
    );
};
