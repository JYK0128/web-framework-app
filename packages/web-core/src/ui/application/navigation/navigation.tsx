import { Link, type ToOptions } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { cn } from '#.generated/shadcn/lib/utils';
import { useI18n } from '#context/i18n';
import { buttonVariants } from '#ui';

export type NavigationVariant = 'side' | 'bar';
export type NavigationBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type NavigationResponsiveVariant = {
  base: NavigationVariant
} & Partial<Record<NavigationBreakpoint, NavigationVariant>>;

export type NavigationItem = {
  id: string
  label: string
  to?: ToOptions['to']
  externalHref?: string
  icon?: ReactNode
  active?: boolean
};

export type NavigationProps = {
  items: readonly NavigationItem[]
  variant?: NavigationVariant | NavigationResponsiveVariant
  collapsed?: boolean
  sideOpen?: boolean
  label?: string
  sideId?: string
  onNavigate?: () => void
  sideClassName?: string
  barClassName?: string
};

const breakpointOrder: NavigationBreakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
const visibilityAt: Record<NavigationBreakpoint, Record<NavigationVariant, Record<NavigationVariant, string>>> = {
  'sm': { side: { side: 'sm:flex', bar: 'sm:hidden' }, bar: { side: 'sm:hidden', bar: 'sm:flex' } },
  'md': { side: { side: 'md:flex', bar: 'md:hidden' }, bar: { side: 'md:hidden', bar: 'md:flex' } },
  'lg': { side: { side: 'lg:flex', bar: 'lg:hidden' }, bar: { side: 'lg:hidden', bar: 'lg:flex' } },
  'xl': { side: { side: 'xl:flex', bar: 'xl:hidden' }, bar: { side: 'xl:hidden', bar: 'xl:flex' } },
  '2xl': { side: { side: '2xl:flex', bar: '2xl:hidden' }, bar: { side: '2xl:hidden', bar: '2xl:flex' } },
};

function getVariantEntries(variant: NavigationProps['variant']): Array<[NavigationBreakpoint | 'base', NavigationVariant]> {
  if (typeof variant === 'string' || !variant) return [['base', typeof variant === 'string' ? variant : 'side']];

  const entries: Array<[NavigationBreakpoint | 'base', NavigationVariant]> = [['base', variant.base]];
  for (const breakpoint of breakpointOrder) {
    const responsiveVariant = variant[breakpoint];
    if (responsiveVariant) entries.push([breakpoint, responsiveVariant]);
  }
  return entries;
}

function getVisibilityClass(entries: Array<[NavigationBreakpoint | 'base', NavigationVariant]>, target: NavigationVariant): string {
  const first = entries[0]?.[1] === target ? 'flex' : 'hidden';
  return [first,
    ...entries.slice(1).map(([breakpoint, current]) => {
      if (breakpoint === 'base') return '';
      return visibilityAt[breakpoint][current][target];
    })].filter(Boolean).join(' ');
}

function getNavigationLinkClassName(item: NavigationItem, variant: NavigationVariant, collapsed: boolean) {
  const isCollapsedSide = collapsed && variant === 'side';
  return cn(
    buttonVariants({ variant: item.active ? 'secondary' : 'ghost' }),
    variant === 'side' && 'w-full justify-start',
    isCollapsedSide && 'justify-center px-2',
  );
}

function getNavigationLinkAccessibility(item: NavigationItem, variant: NavigationVariant, collapsed: boolean) {
  const label = collapsed && variant === 'side' ? item.label : undefined;
  return { 'aria-label': label, 'title': label };
}

function NavigationLink({ item, variant, collapsed, onNavigate }: {
  item: NavigationItem
  variant: NavigationVariant
  collapsed: boolean
  onNavigate?: () => void
}) {
  const className = getNavigationLinkClassName(item, variant, collapsed);
  const accessibilityProps = getNavigationLinkAccessibility(item, variant, collapsed);

  const content = (
    <>
      {item.icon && (
        <span
          aria-hidden="true"
          className="flex size-5 shrink-0 items-center justify-center"
        >
          {item.icon}
        </span>
      )}
      {!(collapsed && variant === 'side') && <span className="truncate">{item.label}</span>}
    </>
  );

  if (item.externalHref) {
    return (
      <a
        href={item.externalHref}
        target="_blank"
        rel="noreferrer"
        {...accessibilityProps}
        onClick={onNavigate}
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={item.to as string}
      aria-current={item.active ? 'page' : undefined}
      {...accessibilityProps}
      onClick={onNavigate}
      className={className}
    >
      {content}
    </Link>
  );
}

/** Render the same app-owned item list as a side or bar navigation at each breakpoint. */
export function Navigation({
  items,
  variant = 'side',
  collapsed = false,
  sideOpen = true,
  label: labelProp,
  sideId,
  onNavigate,
  sideClassName,
  barClassName,
}: NavigationProps) {
  const { t } = useI18n();
  const label = labelProp ?? t('core.navigation.mainMenu');
  const entries = getVariantEntries(variant);
  const responsive = typeof variant === 'object';
  const sideVisibility = getVisibilityClass(entries, 'side');
  const barVisibility = getVisibilityClass(entries, 'bar');
  const renderItems = (kind: NavigationVariant, isCollapsed: boolean) => items.map((item) => (
    <li key={item.id} className="min-w-0">
      <NavigationLink item={item} variant={kind} collapsed={isCollapsed} onNavigate={onNavigate} />
    </li>
  ));

  return (
    <>
      {(responsive || entries[0]?.[1] === 'side') && (
        <nav
          id={sideId}
          aria-label={label}
          className={cn('flex flex-col gap-1', sideVisibility, !sideOpen && `
            hidden
          `, sideClassName)}
        >
          <ul className="grid content-start gap-1">{renderItems('side', collapsed)}</ul>
        </nav>
      )}
      {responsive || entries[0]?.[1] === 'bar'
        ? (
          <nav
            aria-label={label}
            className={cn(`flex flex-row items-center gap-1`, barVisibility, barClassName)}
          >
            <ul className="flex items-center gap-1">{renderItems('bar', false)}</ul>
          </nav>
        )
        : null}
    </>
  );
}
