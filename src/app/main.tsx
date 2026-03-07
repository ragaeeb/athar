import maplibregl from 'maplibre-gl';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { audioManager } from '@/features/audio/audio-manager';
import '@/app/styles/index.css';

maplibregl.setWorkerCount(4);
audioManager.bootstrap();

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found');
}

createRoot(rootElement).render(<RouterProvider router={router} />);
