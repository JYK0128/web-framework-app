import { cva, type VariantProps } from 'class-variance-authority';
import type { IconName } from 'lucide-react/dynamic';
import type { ReactNode } from 'react';

import { Card } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { AppIcon } from '#/components/app/app-icon';
import { getSlotElements } from '#/core/isomorphic/react-slots';

type ActionCardProps = {
  icon: IconName
  iconColor?: string
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
  variant?: ActionCardVariant
};

const actionCardVariants = cva('ring-0', {
  variants: {
    variant: {
      default: 'border border-border',
      outline: 'border border-border bg-background',
      secondary: 'border-0 bg-secondary text-secondary-foreground',
      ghost: 'border-0 bg-transparent',
      destructive: 'border border-destructive/25 bg-destructive/10',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type ActionCardVariant = NonNullable<VariantProps<typeof actionCardVariants>['variant']>;

function ActionCardActions({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div className={cn(
      'flex shrink-0 items-center justify-end gap-2',
      className,
    )}
    >
      {children}
    </div>
  );
}

function ActionCardBadge({ children }: { children: ReactNode }) {
  return children;
}

export function ActionCard({ icon, iconColor, title, description, children, className, variant }: ActionCardProps) {
  const actionContent = getSlotElements(children, ActionCardActions);
  const badgeContent = getSlotElements(children, ActionCardBadge);

  return (
    <Card
      className={cn(
        'flex flex-row items-center gap-4 rounded-xl p-2',
        actionCardVariants({ variant }),
        className,
      )}
    >
      <div className="flex flex-1 items-center gap-3">
        <div className={cn(
          `flex items-center justify-center shrink-0`,
          `rounded-lg bg-current/10 size-9`,
          iconColor,
        )}
        >
          <AppIcon name={icon} className="size-5" />
        </div>
        <div className="grid flex-1 gap-0.5">
          <div className="grid grid-flow-col auto-cols-max items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {title}
            </span>
            {badgeContent}
          </div>
          {
            description && (
              <p className="truncate text-xs text-muted-foreground">
                {description}
              </p>
            )
          }
        </div>
      </div>
      {actionContent}
    </Card>
  );
}

ActionCard.Actions = ActionCardActions;
ActionCard.Badge = ActionCardBadge;
