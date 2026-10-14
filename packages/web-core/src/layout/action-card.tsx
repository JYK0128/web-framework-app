import { getSlotElements } from '@pkg/web-core/slot';
import { Card } from '@pkg/web-core/ui';
import { cn } from '@pkg/web-core/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

type ActionCardDescriptionTone = 'default' | 'warning' | 'error';

type ActionCardProps = {
  icon: ReactNode
  title: string
  description?: ReactNode
  descriptionTone?: ActionCardDescriptionTone
  children?: ReactNode
  variant?: ActionCardVariant
};

const descriptionTones: Record<ActionCardDescriptionTone, string> = {
  default: 'text-muted-foreground',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-destructive',
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

function ActionCardActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {children}
    </div>
  );
}

function ActionCardComponent({
  icon,
  title,
  description,
  descriptionTone = 'default',
  children,
  variant,
}: ActionCardProps) {
  const actionContent = getSlotElements(children, ActionCardActions);

  return (
    <Card
      className={cn(
        'flex w-full flex-col items-stretch gap-3 rounded-xl p-2',
        actionCardVariants({ variant }),
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="
            flex size-9 shrink-0 items-center justify-center rounded-lg
            bg-current/10
            [&>svg]:size-5
          "
          >
            {icon}
          </div>
          <div className="grid flex-1 gap-0.5">
            <span className="text-sm font-bold text-foreground">{title}</span>
            {description && (
              <p className={cn('truncate text-xs', descriptionTones[descriptionTone])}>
                {description}
              </p>
            )}
          </div>
        </div>
        {actionContent.length > 0 && (
          <div className="flex shrink-0 items-center gap-2">{actionContent}</div>
        )}
      </div>
    </Card>
  );
}

export const ActionCard = Object.assign(ActionCardComponent, {
  Actions: ActionCardActions,
});
