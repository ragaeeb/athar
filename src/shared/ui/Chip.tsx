import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/ui/cn';

type ChipTone = 'default' | 'accent' | 'success' | 'warning';

type ChipProps = HTMLAttributes<HTMLDivElement> & {
    tone?: ChipTone;
};

const toneClasses: Record<ChipTone, string> = {
    accent: 'border-gold-400/25 bg-gold-400/10 text-gold-300',
    default: 'border-white/10 bg-white/5 text-sand-50',
    success: 'border-teal-500/30 bg-teal-500/12 text-sand-50',
    warning: 'border-[color:var(--color-ui-warning)]/30 bg-[color:var(--color-ui-warning)]/10 text-sand-50',
};

export const Chip = ({ className, tone = 'default', ...props }: ChipProps) => (
    <div className={cn('rounded-full border px-3 py-1.5 text-sm', toneClasses[tone], className)} {...props} />
);
