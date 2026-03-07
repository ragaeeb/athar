type HadithCounterProps = {
    current: number;
    locked: number;
    required: number;
    totalVerified: number;
};

export const HadithCounter = ({ current, locked, required, totalVerified }: HadithCounterProps) => (
    <div className="rounded-2xl border border-white/10 bg-ink-950/60 px-4 py-3 backdrop-blur">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand-100/60">Hadith</p>
        <div className="mt-1 flex items-baseline gap-3">
            <span className="font-mono text-2xl font-bold text-gold-400">
                {locked + current}/{required}
            </span>
            <span className="text-sm text-sand-100/70">Level</span>
        </div>
        <p className="mt-1 text-xs text-sand-100/70">
            Carrying {current} unverified, preserved total {totalVerified}
        </p>
    </div>
);
