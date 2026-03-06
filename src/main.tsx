import maplibregl from 'maplibre-gl';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { audioManager } from '@/lib/audio';
import { router } from '@/router';
import '@/styles.css';

maplibregl.setWorkerCount(4);
audioManager.bootstrap();

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found');
}

createRoot(rootElement).render(<RouterProvider router={router} />);
