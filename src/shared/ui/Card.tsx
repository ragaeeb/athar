import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/ui/cn';

type CardTone = 'default' | 'muted' | 'reward';

type CardProps = HTMLAttributes<HTMLDivElement> & {
    tone?: CardTone;
};

const toneClasses: Record<CardTone, string> = {
    default: 'border-white/10 bg-ink-950/72',
    muted: 'border-white/8 bg-white/4',
    reward: 'border-gold-400/20 bg-[#0c161d]/85',
};

export const Card = ({ className, tone = 'default', ...props }: CardProps) => (
    <div className={cn('rounded-[1.75rem] border shadow-2xl backdrop-blur', toneClasses[tone], className)} {...props} />
);
