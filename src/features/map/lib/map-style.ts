import type { StyleSpecification } from 'maplibre-gl';

const rasterStyle = (variant: 'light_nolabels' | 'dark_nolabels'): StyleSpecification => ({
    layers: [{ id: 'carto-basemap', source: 'carto-raster', type: 'raster' }],
    sources: {
        'carto-raster': {
            attribution: '© OpenStreetMap contributors, © CARTO',
            tileSize: 256,
            tiles: [
                `https://a.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
                `https://b.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
                `https://c.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
                `https://d.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
            ],
            type: 'raster',
        },
    },
    version: 8,
});

export const MAP_STYLES = {
    city: rasterStyle('dark_nolabels'),
    desert: rasterStyle('light_nolabels'),
};
