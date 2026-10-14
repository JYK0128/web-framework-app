import { getSlotElements } from '@pkg/web-core/slot';
import { AppIcon } from '@pkg/web-core/ui';
import { cn } from '@pkg/web-core/utils';
import type { IconName } from 'lucide-react/dynamic';
import type { ReactNode } from 'react';

type PageSectionProps = {
  icon?: IconName
  title?: string
  description?: string
  isLoading?: boolean
  children: ReactNode
};

function PageSectionActions({ children, className }: { children: ReactNode, className?: string }) {
  return <div className={cn('flex items-center justify-end gap-2', className)}>{children}</div>;
}

function PageSectionContent({ children, className }: { children: ReactNode, className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}

function PageSectionLoading({ children }: { children: ReactNode }) {
  return children;
}

function PageSectionComponent({ icon, title, description, isLoading = false, children }: PageSectionProps) {
  const actionSlotContent = getSlotElements(children, PageSectionActions);
  const loadingContent = getSlotElements(children, PageSectionLoading);
  const contentSlotChildren = getSlotElements(children, PageSectionContent);

  return (
    <section className="grid size-full grid-rows-[auto_minmax(0,1fr)] gap-1">
      <header className="relative flex items-center justify-between gap-4 p-2">
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="
                flex size-9 items-center justify-center rounded-lg bg-primary/10
                text-primary shadow-xs
              "
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
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actionSlotContent.length > 0 && (
          <div className="absolute top-2 right-2 z-10">{actionSlotContent}</div>
        )}
      </header>
      {isLoading ? loadingContent : contentSlotChildren}
    </section>
  );
}

export const PageSection = Object.assign(PageSectionComponent, {
  Actions: PageSectionActions,
  Content: PageSectionContent,
  Loading: PageSectionLoading,
});
