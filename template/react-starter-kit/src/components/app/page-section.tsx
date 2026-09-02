import { type IconName } from 'lucide-react/dynamic';
import type { ReactNode } from 'react';

import { cn } from '#/.generated/shadcn/lib/utils';
import { getSlotElements } from '#/core/isomorphic/react-slots';

import { AppIcon } from './app-icon';

type PageSectionProps = {
  icon?: IconName
  title?: ReactNode
  description?: ReactNode
  isLoading?: boolean
  children: ReactNode
};

function PageSectionActions({ children, className }: { children: ReactNode, className?: string }) {
  return <div className={cn('flex items-center justify-end gap-2', className)}>{children}</div>;
}

function PageSectionContent({ children, className }: { children: ReactNode, className?: string }) {
  return <main className={cn(className)}>{children}</main>;
}

function PageSectionDialogs({ children }: { children: ReactNode }) {
  return children;
}

function PageSectionLoading({ children }: { children: ReactNode }) {
  return children;
}

function PageSectionComponent({ icon, title, description, isLoading = false, children }: PageSectionProps) {
  const actionContent = getSlotElements(children, PageSectionActions);
  const dialogContent = getSlotElements(children, PageSectionDialogs).map(
    (child) => child.props.children,
  );
  const loadingContent = getSlotElements(children, PageSectionLoading);
  const contentSlotChildren = getSlotElements(children, PageSectionContent);
  const childrenContent = isLoading ? loadingContent : contentSlotChildren;

  return [
    <section
      key="content"
      className={cn(
        'size-full grid grid-rows-[auto_minmax(0,1fr)] gap-1',
      )}
    >
      <header className="flex items-center justify-between gap-4 p-2">
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            {icon && (
              <div className={cn(
                'flex items-center justify-center',
                'bg-primary/10 text-primary shadow-xs rounded-lg',
                'size-9',
              )}
              >
                <AppIcon name={icon} className="size-5" />
              </div>
            )}
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actionContent}
      </header>
      {childrenContent}
    </section>,
    ...dialogContent,
  ];
}

export const PageSection = Object.assign(PageSectionComponent, {
  Actions: PageSectionActions,
  Content: PageSectionContent,
  Dialogs: PageSectionDialogs,
  Loading: PageSectionLoading,
});
