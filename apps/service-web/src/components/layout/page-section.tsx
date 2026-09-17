import type { ReactNode } from 'react';

import { cn } from '#/.generated/shadcn/lib/utils';
import { getSlotElements } from '#/core/isomorphic/react-slots';

function PageSectionActions({ children, className }: { children: ReactNode, className?: string }) {
  return <div className={cn('flex items-center justify-end gap-2', className)}>{children}</div>;
}

function PageSectionContent({ children, className }: { children: ReactNode, className?: string }) {
  return <main className={cn('scroll-y', className)}>{children}</main>;
}

function PageSectionLoading({ children }: { children: ReactNode }) {
  return children;
}

function PageSectionComponent({ title, description, isLoading = false, children }: {
  title?: string
  description?: string
  isLoading?: boolean
  children: ReactNode
}) {
  const actions = getSlotElements(children, PageSectionActions);
  const content = getSlotElements(children, isLoading ? PageSectionLoading : PageSectionContent);

  return (
    <section className="grid size-full grid-rows-[auto_minmax(0,1fr)] gap-1">
      <header className="flex items-center justify-between gap-4 p-2">
        <div className="grid gap-1">
          {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      {content}
    </section>
  );
}

export const PageSection = Object.assign(PageSectionComponent, {
  Actions: PageSectionActions,
  Content: PageSectionContent,
  Loading: PageSectionLoading,
});
