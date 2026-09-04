import { Link, type ToOptions } from '@tanstack/react-router';
import { cva } from 'class-variance-authority';
import type { IconName } from 'lucide-react/dynamic';

import { Card, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { AppIcon } from '#/components/app/app-icon';

const linkCardVariants = cva(
  `
    grid h-full grid-rows-[minmax(0,1fr)] transition-all duration-200
    hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md
  `,
  {
    variants: {
      mini: { true: `rounded-none p-0 border-0 ring-0 bg-transparent` },
      collapsed: { true: 'bg-transparent ring-0' },
      isActive: { true: `bg-primary/10` },
    },
  },
);

const linkCardHeaderVariants = cva('grid gap-2', {
  variants: {
    mini: {
      true: `flex items-center gap-3 px-5 py-1.5`,
    },
    collapsed: { true: 'items-center' },
    isActive: { true: '' },
  },
});

const linkCardIconVariants = cva(
  'flex items-center justify-center shrink-0 rounded-lg bg-current/10',
  {
    variants: {
      mini: { true: '' },
      collapsed: { true: '' },
      isActive: { true: '' },
    },
  },
);

const linkCardTitleVariants = cva(
  'text-sm font-bold text-foreground',
  {
    variants: {
      mini: { true: 'truncate font-normal' },
      isActive: { true: 'font-bold' },
      collapsed: { true: 'hidden' },
    },
  },
);

type LinkCardProps = {
  to: NonNullable<ToOptions['to']>
  title: string
  description?: string
  icon: IconName
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
  const linkProps = collapsed
    ? { title, 'aria-label': title }
    : {};

  return (
    <Link
      {...linkProps}
      to={to}
      onClick={onClick}
      className="block size-full"
    >
      <Card
        className={linkCardVariants({ mini, collapsed, isActive })}
      >
        <CardHeader
          className={linkCardHeaderVariants({ mini, collapsed, isActive })}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                linkCardIconVariants({ mini, collapsed, isActive }),
                iconColor,
              )}
            >
              <AppIcon name={icon} />
            </div>
            <CardTitle
              className={linkCardTitleVariants({ mini, collapsed, isActive })}
            >
              {title}
            </CardTitle>
          </div>
          {description !== undefined && (
            <CardDescription
              className="line-clamp-2 text-xs"
            >
              {description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}
