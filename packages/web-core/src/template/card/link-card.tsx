import { Link } from '@tanstack/react-router';
import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { Card, CardDescription, CardHeader, CardTitle } from '#ui';
import { cn } from '#utils';

const linkCardVariants = cva(
  `
    grid h-full grid-rows-[minmax(0,1fr)] transition-all duration-200
    hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md
  `,
  {
    variants: {
      mini: { true: 'rounded-none border-0 bg-transparent p-0 ring-0' },
      collapsed: { true: 'bg-transparent ring-0' },
      isActive: { true: 'bg-primary/10' },
    },
  },
);

const linkCardHeaderVariants = cva('grid gap-2', {
  variants: {
    mini: { true: 'flex items-center gap-3 px-5 py-1.5' },
    collapsed: { true: 'items-center' },
  },
});

const linkCardIconVariants = cva(`
  flex shrink-0 items-center justify-center rounded-lg bg-current/10
`);

const linkCardTitleVariants = cva('text-sm font-bold text-foreground', {
  variants: {
    mini: { true: 'truncate font-normal' },
    collapsed: { true: 'hidden' },
  },
});

type LinkCardProps = {
  to: string
  title: string
  description?: string
  icon: ReactNode
  iconColor?: string
  mini?: boolean
  collapsed?: boolean
  isActive?: boolean
  onClick?: () => void
};

export function LinkCard({
  to,
  title,
  description,
  icon,
  iconColor,
  mini,
  collapsed,
  isActive,
  onClick,
}: LinkCardProps) {
  return (
    <Link
      title={collapsed ? title : undefined}
      aria-label={collapsed ? title : undefined}
      to={to}
      onClick={onClick}
      className="block size-full"
    >
      <Card className={linkCardVariants({ mini, collapsed, isActive })}>
        <CardHeader className={linkCardHeaderVariants({ mini, collapsed })}>
          <div className="flex items-center gap-3">
            <div className={cn(linkCardIconVariants(), iconColor)}>{icon}</div>
            <CardTitle className={linkCardTitleVariants({ mini, collapsed })}>{title}</CardTitle>
          </div>
          {description !== undefined && (
            <CardDescription className="line-clamp-2 text-xs">{description}</CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}
