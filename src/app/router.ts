import { createElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { App } from '@/app/App';
import { RouteError } from '@/app/routes/ErrorRoute';
import { LevelCompleteRoute } from '@/app/routes/game/complete';
import { gameLevelLoader } from '@/app/routes/game/level.loader';
import { GameLevelRoute } from '@/app/routes/game/level-route';
import { IndexRoute } from '@/app/routes/index';

export const router = createBrowserRouter([
    {
        children: [
            {
                element: createElement(IndexRoute),
                index: true,
            },
            {
                element: createElement(GameLevelRoute),
                loader: gameLevelLoader,
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
