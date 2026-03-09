import { useEffect, useState } from 'react';

import { supportsTouchTraversalControls } from '@/features/gameplay/controllers/touch-support';
import { useGameplaySessionStore } from '@/features/gameplay/state/session.store';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';

export const TraversalOnboarding = () => {
    const onboardingDismissed = useGameplaySessionStore((state) => state.onboardingDismissed);
    const dismissOnboarding = useGameplaySessionStore((state) => state.dismissOnboarding);
    const [touchSupported, setTouchSupported] = useState(false);

    useEffect(() => {
        setTouchSupported(supportsTouchTraversalControls());
    }, []);

    if (onboardingDismissed) {
        return null;
    }

    return (
        <div className="pointer-events-none absolute top-24 left-1/2 z-20 w-full max-w-xl -translate-x-1/2 px-4 lg:top-28">
            <Card tone="reward" className="pointer-events-auto rounded-[2rem] p-6 text-center">
                <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Athar Guidance</p>
                <h2 className="mt-3 font-display text-3xl text-sand-50">Begin the Route</h2>
                <p className="mt-4 text-sand-100/75">
                    Gather hadith, bank them with scholars, and reach the final milestone before the route closes.
                </p>
                <div className="mt-5 grid gap-3 text-left">
                    <Card tone="muted" className="rounded-2xl p-4">
                        <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Movement</p>
                        <p className="mt-2 text-sm text-sand-50">
                            {touchSupported
                                ? 'Use the touch pad at the lower-left to guide the scholar.'
                                : 'Move with WASD or the arrow keys.'}
                        </p>
                    </Card>
                    <Card tone="muted" className="rounded-2xl p-4">
                        <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Banking</p>
                        <p className="mt-2 text-sm text-sand-50">
                            Receive hadith at each scholar stop to preserve carried tokens into chapter progress.
                        </p>
                    </Card>
                    <Card tone="muted" className="rounded-2xl p-4">
                        <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Focus</p>
                        <p className="mt-2 text-sm text-sand-50">
                            {touchSupported
                                ? 'Map gestures are intentionally suppressed during traversal to avoid accidental camera conflicts.'
                                : 'Use Escape to pause and inspect the route at any time.'}
                        </p>
                    </Card>
                </div>
                <Button className="mt-6 px-6" onClick={dismissOnboarding}>
                    Start Journey
                </Button>
            </Card>
        </div>
    );
};
