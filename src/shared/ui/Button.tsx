import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { cn } from '@/shared/ui/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    size?: ButtonSize;
    variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
    ghost: 'border border-white/12 bg-white/4 text-sand-50 hover:border-white/24 hover:bg-white/8',
    primary: 'bg-gold-400 text-ink-950 hover:bg-[#f0cf7d]',
    secondary: 'border border-white/15 bg-ink-950/78 text-sand-50 hover:border-white/24 hover:bg-white/8',
};

const sizeClasses: Record<ButtonSize, string> = {
    md: 'px-5 py-3',
    sm: 'px-4 py-2',
};

export const getButtonClassName = ({
    className,
    size = 'md',
    variant = 'primary',
}: Pick<ButtonProps, 'className' | 'size' | 'variant'> = {}) =>
    cn(
        'inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        sizeClasses[size],
        variantClasses[variant],
        className,
    );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, size = 'md', type = 'button', variant = 'primary', ...props }, ref) => (
        <button ref={ref} type={type} className={getButtonClassName({ className, size, variant })} {...props} />
    ),
);

Button.displayName = 'Button';
