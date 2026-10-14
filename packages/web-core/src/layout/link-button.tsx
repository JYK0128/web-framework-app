import { buttonVariants } from '@pkg/web-core/ui';
import { cn } from '@pkg/web-core/utils';
import { Link } from '@tanstack/react-router';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

type LinkButtonProps = ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

export function LinkButton({ className, variant, size, ...props }: LinkButtonProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
