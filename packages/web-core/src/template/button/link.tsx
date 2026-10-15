import { Link as RouterLink } from '@tanstack/react-router';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { buttonVariants } from '#ui';
import { cn } from '#utils';

type LinkProps = ComponentProps<typeof RouterLink> & VariantProps<typeof buttonVariants>;

export function Link({ className, variant, size, ...props }: LinkProps) {
  return <RouterLink className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
