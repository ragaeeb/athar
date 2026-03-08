import type { HTMLAttributes } from 'react';

import { Card } from '@/shared/ui/Card';
import { cn } from '@/shared/ui/cn';

export const DrawerPanel = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <Card className={cn('p-5', className)} {...props} />
);
