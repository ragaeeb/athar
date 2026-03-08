import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/ui/cn';
import { Scrim } from '@/shared/ui/Scrim';

export const Overlay = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('absolute inset-0 z-30 flex items-center justify-center p-4', className)} {...props}>
        <Scrim />
        <div className="relative z-10">{children}</div>
    </div>
);
