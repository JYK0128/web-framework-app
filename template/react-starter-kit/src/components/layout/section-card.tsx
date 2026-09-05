import { cva, type VariantProps } from 'class-variance-authority';
import { type IconName } from 'lucide-react/dynamic';
import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { AppIcon } from '#/components/app/app-icon';
import { getSlotElements } from '#/core/isomorphic/react-slots';

type SectionCardProps = {
  icon?: IconName
  title?: string
  description?: string
  isLoading?: boolean
  children: ReactNode
  textSize?: SectionCardTextSize
  variant?: SectionCardVariant
};

const sectionCardVariants = cva('', {
  variants: {
    variant: {
      default: 'border border-border ring-0',
      outline: 'border border-border bg-background ring-0',
      secondary: 'bg-secondary text-secondary-foreground ring-0',
      ghost: 'border-0 bg-transparent ring-0',
      destructive: 'border border-destructive/25 bg-destructive/10 ring-0',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type SectionCardVariant = NonNullable<
  VariantProps<typeof sectionCardVariants>['variant']
>;

type SectionCardTextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';

const sectionCardTextSizes = {
  'xs': 'text-xs',
  'sm': 'text-sm',
  'base': 'text-base',
  'lg': 'text-lg',
  'xl': 'text-xl',
  '2xl': 'text-2xl',
} satisfies Record<SectionCardTextSize, string>;

const sectionCardDescriptionSizes = {
  'xs': 'xs',
  'sm': 'xs',
  'base': 'sm',
  'lg': 'base',
  'xl': 'lg',
  '2xl': 'xl',
} satisfies Record<SectionCardTextSize, SectionCardTextSize>;

const sectionCardIconSizes = {
  'xs': { wrapper: 'size-4', icon: 'size-3' },
  'sm': { wrapper: 'size-5', icon: 'size-4' },
  'base': { wrapper: 'size-6', icon: 'size-5' },
  'lg': { wrapper: 'size-7', icon: 'size-6' },
  'xl': { wrapper: 'size-8', icon: 'size-7' },
  '2xl': { wrapper: 'size-9', icon: 'size-8' },
} satisfies Record<SectionCardTextSize, { wrapper: string, icon: string }>;

function SectionCardContent({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <CardContent className={cn('p-2', className)}>{children}</CardContent>;
}

function SectionCardLoading({ children }: { children: ReactNode }) {
  return children;
}

function SectionCardActions({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      {children}
    </div>
  );
}

function SectionCardComponent({
  icon,
  title,
  description,
  isLoading = false,
  children,
  textSize = 'base',
  variant,
}: SectionCardProps) {
  const titleSize = textSize;
  const descriptionSize = sectionCardDescriptionSizes[textSize];
  const iconSize = sectionCardIconSizes[textSize];
  const actionSlotContent = getSlotElements(children, SectionCardActions);
  const actionContent = actionSlotContent.length > 0
    ? (
      <div className="absolute -top-2 right-2 z-10">
        {actionSlotContent}
      </div>
    )
    : null;
  const childrenContent = getSlotElements(children, SectionCardContent);
  const loadingContent = getSlotElements(children, SectionCardLoading);
  const renderedContent = isLoading ? loadingContent : childrenContent;
  const hasContent = renderedContent.length > 0;
  const hasHeader = Boolean(icon || title || description || actionSlotContent.length > 0);
  return (
    <Card
      className={cn(
        'grid gap-0 overflow-hidden',
        hasHeader
          ? 'grid-rows-[auto_minmax(0,1fr)]'
          : 'grid-rows-[minmax(0,1fr)]',
        sectionCardVariants({ variant }),
      )}
    >
      {hasHeader && (
        <CardHeader className="relative flex items-center justify-between gap-4">
          <div className="grid gap-1">
            <div className="flex items-center gap-2">
              {icon && (
                <div
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-lg',
                    'bg-primary/10 text-primary shadow-xs',
                    iconSize.wrapper,
                  )}
                >
                  <AppIcon name={icon} className={iconSize.icon} />
                </div>
              )}
              {title && (
                <CardTitle className={sectionCardTextSizes[titleSize]}>
                  {title}
                </CardTitle>
              )}
            </div>
            {description && (
              <CardDescription
                className={sectionCardTextSizes[descriptionSize]}
              >
                {description}
              </CardDescription>
            )}
          </div>
          {actionContent}
        </CardHeader>
      )}
      {hasContent && renderedContent}
    </Card>
  );
}

export const SectionCard = Object.assign(SectionCardComponent, {
  Actions: SectionCardActions,
  Content: SectionCardContent,
  Loading: SectionCardLoading,
});
