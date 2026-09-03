import { Loader2 } from 'lucide-react';
import { type IconName } from 'lucide-react/dynamic';
import type { ComponentProps, ReactNode } from 'react';

import { Button } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

import { AppIcon } from './app-icon';

export type ActionItem = Omit<ComponentProps<typeof Button>, 'children'> & {
  label?: ReactNode
  icon?: IconName
  iconPosition?: 'start' | 'end'
  loading?: boolean
  hidden?: boolean
};

export function renderActionItems(actions?: ActionItem[]) {
  if (!actions || actions.length === 0) {
    return null;
  }

  const visibleActions = actions.filter((action) => !action.hidden);
  if (visibleActions.length === 0) {
    return null;
  }

  return visibleActions.map((action, index) => {
    const {
      label,
      icon,
      iconPosition = 'start',
      loading = false,
      disabled,
      className,
      key,
      ...buttonProps
    } = action;

    const actionKey = key ?? (typeof label === 'string' ? `${label}-${index}` : index);

    return (
      <Button
        key={actionKey}
        disabled={disabled || loading}
        className={cn('gap-2', className)}
        {...buttonProps}
      >
        {loading
          ? (
            <Loader2 className="size-4 animate-spin" />
          )
          : (
            icon && iconPosition === 'start' && (
              <AppIcon
                name={icon}
                className="size-4"
              />
            )
          )}
        {label && <span>{label}</span>}
        {!loading && icon && iconPosition === 'end' && (
          <AppIcon name={icon} className="size-4" />
        )}
      </Button>
    );
  });
}
