import { Link } from 'react-router-dom';
import type { SessionDefeatState } from '@/features/gameplay/state/session.store';
import { Button, getButtonClassName } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Overlay } from '@/shared/ui/Overlay';

type GameplayDefeatOverlayProps = {
    defeat: SessionDefeatState;
    onRestart: () => void;
};

export const GameplayDefeatOverlay = ({ defeat, onRestart }: GameplayDefeatOverlayProps) => (
    <Overlay>
        <Card tone="default" className="w-full max-w-2xl rounded-[2rem] p-8 text-center">
            <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Route Broken</p>
            <h2 className="mt-4 font-display text-4xl text-sand-50">{defeat.title}</h2>
            <p className="mt-4 text-sand-100/75">{defeat.detail}</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.28em] text-sand-100/55">
                Restart the chapter to continue the journey.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button onClick={onRestart}>Restart Chapter</Button>
                <Link to="/" className={getButtonClassName({ variant: 'secondary' })}>
                    Return Home
                </Link>
            </div>
        </Card>
    </Overlay>
);
