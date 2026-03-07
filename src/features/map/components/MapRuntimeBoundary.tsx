import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Overlay } from '@/shared/ui/Overlay';

type MapRuntimeBoundaryProps = {
    children: ReactNode;
    resetKey: number | string;
    onRetry: () => void;
};

type MapRuntimeBoundaryState = {
    error: Error | null;
};

export class MapRuntimeBoundary extends Component<MapRuntimeBoundaryProps, MapRuntimeBoundaryState> {
    state: MapRuntimeBoundaryState = {
        error: null,
    };

    static getDerivedStateFromError(error: Error): MapRuntimeBoundaryState {
        return {
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[athar:runtime] gameplay route crashed', error, errorInfo);
    }

    componentDidUpdate(previousProps: MapRuntimeBoundaryProps) {
        if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
            this.setState({
                error: null,
            });
        }
    }

    private handleRetry = () => {
        this.setState({
            error: null,
        });
        this.props.onRetry();
    };

    render() {
        if (!this.state.error) {
            return this.props.children;
        }

        return (
            <Overlay>
                <Card tone="reward" className="w-full max-w-xl rounded-[2rem] p-8 text-center">
                    <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Athar</p>
                    <h2 className="mt-4 font-display text-4xl text-sand-50">Gameplay Render Failure</h2>
                    <p className="mt-4 text-sand-100/75">
                        The map scene crashed before gameplay could continue. Retry the renderer or return home.
                    </p>
                    <p className="mt-4 font-mono text-xs text-sand-100/60">{this.state.error.message}</p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Button onClick={this.handleRetry}>Retry Rendering</Button>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sand-50"
                        >
                            Return Home
                        </Link>
                    </div>
                </Card>
            </Overlay>
        );
    }
}
