import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { MapRuntimeBoundary } from '@/features/map/components/MapRuntimeBoundary';

const Thrower = ({ explode }: { explode: boolean }) => {
    if (explode) {
        throw new Error('boom');
    }

    return <div>scene ok</div>;
};

describe('MapRuntimeBoundary', () => {
    it('recovers when the reset key changes after a render failure', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const onRetry = vi.fn();

        const view = render(
            <MemoryRouter>
                <MapRuntimeBoundary resetKey={0} onRetry={onRetry}>
                    <Thrower explode />
                </MapRuntimeBoundary>
            </MemoryRouter>,
        );

        expect(screen.getByText('Gameplay Render Failure')).toBeInTheDocument();
        expect(screen.getByText('boom')).toBeInTheDocument();

        view.rerender(
            <MemoryRouter>
                <MapRuntimeBoundary resetKey={1} onRetry={onRetry}>
                    <Thrower explode={false} />
                </MapRuntimeBoundary>
            </MemoryRouter>,
        );

        expect(screen.getByText('scene ok')).toBeInTheDocument();
        expect(onRetry).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });
});
