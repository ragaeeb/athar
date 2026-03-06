import { createElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { App } from '@/App';
import { RouteError } from '@/routes/ErrorRoute';
import { GameLevelRoute } from '@/routes/game/$levelId';
import { LevelCompleteRoute } from '@/routes/game/complete';
import { IndexRoute } from '@/routes/index';

export const router = createBrowserRouter([
    {
        children: [
            {
                element: createElement(IndexRoute),
                index: true,
            },
            {
                element: createElement(GameLevelRoute),
                path: 'game/:levelId',
            },
            {
                element: createElement(LevelCompleteRoute),
                path: 'game/:levelId/complete',
            },
        ],
        element: createElement(App),
        errorElement: createElement(RouteError),
        path: '/',
    },
]);
