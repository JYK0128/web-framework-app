import { cn } from '@pkg/web-core/utils';
import type { ToOptions } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

export type NaviVariant = 'side' | 'bar';
export type NaviBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type NaviResponsiveVariant = {
  base: NaviVariant
} & Partial<Record<NaviBreakpoint, NaviVariant>>;

export type NaviItem = {
  id: string
  label: string
  to: ToOptions['to']
  icon?: ReactNode
  active?: boolean
};

export type NaviProps = {
  items: readonly NaviItem[]
  variant?: NaviVariant | NaviResponsiveVariant
  collapsed?: boolean
  sideOpen?: boolean
  label?: string
  sideId?: string
  onNavigate?: () => void
  sideClassName?: string
  barClassName?: string
};

const breakpointOrder: NaviBreakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
const visibilityAt: Record<NaviBreakpoint, Record<NaviVariant, Record<NaviVariant, string>>> = {
  sm: { side: { side: 'sm:flex', bar: 'sm:hidden' }, bar: { side: 'sm:hidden', bar: 'sm:flex' } },
  md: { side: { side: 'md:flex', bar: 'md:hidden' }, bar: { side: 'md:hidden', bar: 'md:flex' } },
  lg: { side: { side: 'lg:flex', bar: 'lg:hidden' }, bar: { side: 'lg:hidden', bar: 'lg:flex' } },
  xl: { side: { side: 'xl:flex', bar: 'xl:hidden' }, bar: { side: 'xl:hidden', bar: 'xl:flex' } },
  '2xl': { side: { side: '2xl:flex', bar: '2xl:hidden' }, bar: { side: '2xl:hidden', bar: '2xl:flex' } },
};

function getVariantEntries(variant: NaviProps['variant']): Array<[NaviBreakpoint | 'base', NaviVariant]> {
  if (typeof variant === 'string' || !variant) return [['base', typeof variant === 'string' ? variant : 'side']];
  return [
    ['base', variant.base],
    ...breakpointOrder.flatMap((breakpoint) => variant[breakpoint] ? [[breakpoint, variant[breakpoint]!] as [NaviBreakpoint, NaviVariant]] : []),
  ];
}

function getVisibilityClass(entries: Array<[NaviBreakpoint | 'base', NaviVariant]>, target: NaviVariant): string {
  const first = entries[0]?.[1] === target ? 'flex' : 'hidden';
  return [first, ...entries.slice(1).map(([breakpoint, current]) => {
    if (breakpoint === 'base') return '';
    return visibilityAt[breakpoint][current][target];
  })].filter(Boolean).join(' ');
}

function NaviLink({ item, variant, collapsed, onNavigate }: {
  item: NaviItem
  variant: NaviVariant
  collapsed: boolean
  onNavigate?: () => void
}) {
  const className = variant === 'bar'
    ? cn('inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground', item.active && 'bg-accent text-accent-foreground')
    : cn('flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground', collapsed && 'justify-center px-2', item.active && 'bg-accent text-accent-foreground');

  return (
    <Link
      to={item.to}
      aria-current={item.active ? 'page' : undefined}
      aria-label={collapsed && variant === 'side' ? item.label : undefined}
      title={collapsed && variant === 'side' ? item.label : undefined}
      onClick={onNavigate}
      className={className}
    >
      {item.icon && <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">{item.icon}</span>}
      {!(collapsed && variant === 'side') && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

/** Render the same app-owned item list as a side or bar navigation at each breakpoint. */
export function Navi({
  items,
  variant = 'side',
  collapsed = false,
  sideOpen = true,
  label = '주요 메뉴',
  sideId,
  onNavigate,
  sideClassName,
  barClassName,
}: NaviProps) {
  const entries = getVariantEntries(variant);
  const responsive = typeof variant === 'object' && variant !== null;
  const sideVisibility = getVisibilityClass(entries, 'side');
  const barVisibility = getVisibilityClass(entries, 'bar');
  const renderItems = (kind: NaviVariant, isCollapsed: boolean) => items.map((item) => (
    <li key={item.id} className="min-w-0">
      <NaviLink item={item} variant={kind} collapsed={isCollapsed} onNavigate={onNavigate} />
    </li>
  ));

  return (
    <>
      {(responsive || entries[0]?.[1] === 'side') && (
        <nav id={sideId} aria-label={label} className={cn('flex flex-col gap-1', sideVisibility, !sideOpen && 'hidden', sideClassName)}>
          <ul className="grid content-start gap-1">{renderItems('side', collapsed)}</ul>
        </nav>
      )}
      {responsive || entries[0]?.[1] === 'bar' ? (
        <nav aria-label={label} className={cn('flex flex-row items-center gap-1', barVisibility, barClassName)}>
          <ul className="flex items-center gap-1">{renderItems('bar', false)}</ul>
        </nav>
      ) : null}
    </>
  );
}
