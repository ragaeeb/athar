import 'maplibre-gl/dist/maplibre-gl.css';

import { AdaptiveDpr, Environment } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import MapLibreMap, { type MapRef } from 'react-map-gl/maplibre';
import { Canvas } from 'react-three-map/maplibre';
import { PCFShadowMap } from 'three';

import type { LevelConfig } from '@/content/levels/types';
import {
    recordManualMapInteraction,
    setPerfMapViewController,
    updateMapViewSnapshot,
} from '@/features/debug/perf-metrics';
import { getSunLightPosition } from '@/features/map/lib/geo';

type MapSceneProps = {
    level: LevelConfig;
    children: React.ReactNode;
};

export const MapScene = ({ level, children }: MapSceneProps) => {
    const sunPosition = getSunLightPosition(level.origin, level.lighting);
    const mapRef = useRef<MapRef | null>(null);
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
    }, [mapLoaded, level]);

    return (
        <MapLibreMap
            ref={mapRef}
            reuseMaps
            initialViewState={level.initialView}
            keyboard={false}
            onLoad={() => {
                setMapLoaded(true);
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
