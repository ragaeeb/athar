import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/ui/cn';

export const Scrim = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('absolute inset-0 bg-[color:var(--color-ui-scrim)]', className)} {...props} />
);
