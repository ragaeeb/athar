import { coordsToVector3 } from 'react-three-map/maplibre';

import type { Coords } from '@/content/levels/types';

export const coordsToPlayerLocalPosition = (coords: Coords, origin: Coords) =>
    coordsToVector3({ latitude: coords.lat, longitude: coords.lng }, { latitude: origin.lat, longitude: origin.lng });
