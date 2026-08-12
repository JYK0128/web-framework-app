import { Link, useLocation } from '@tanstack/react-router';
import { ChevronRight, FileText, KeyRound, LayoutDashboard, type LucideIcon, ShieldCheck, Users } from 'lucide-react';

import { Badge, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

export interface NavGroup {
  groupLabel: string
  items: NavItem[]
}

export const dashboardNavItem: NavItem = {
  title: '대시보드',
  href: '/admin',
  icon: LayoutDashboard,
};

export const adminNavGroups: NavGroup[] = [
  {
    groupLabel: '사용자 관리',
    items: [
      {
        title: '서비스 회원 관리',
        href: '/admin/users',
        icon: Users,
      },
      {
        title: '서비스 약관 관리',
        href: '/admin/terms',
        icon: FileText,
      },
    ],
  },
  {
    groupLabel: '관리자 관리',
    items: [
      {
        title: '관리자 계정 관리',
        href: '/admin/system-users',
        icon: ShieldCheck,
      },
      {
        title: '관리자 약관 관리',
        href: '/admin/system-terms',
        icon: FileText,
      },
      {
        title: '관리자 접근 제어',
        href: '/admin/permissions',
        icon: KeyRound,
      },
    ],
  },
];

interface AdminSidebarProps {
  isCollapsed?: boolean
  onItemClick?: () => void
  className?: string
}

export function AdminSidebar({ isCollapsed = false, onItemClick, className }: AdminSidebarProps) {
  const location = useLocation();

  const renderNavItem = (item: NavItem) => {
    const isActive = item.href === '/admin'
      ? location.pathname === '/admin'
      : (location.pathname === item.href || location.pathname.startsWith(item.href + '/'));

    const Icon = item.icon;

    if (isCollapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger
            render={(props) => (
              <Link
                {...props}
                to={item.href}
                onClick={onItemClick}
                className={cn(
                  `
                    flex size-10 items-center justify-center rounded-lg
                    transition-all
                  `,
                  isActive
                    ? `bg-primary text-primary-foreground shadow-sm`
                    : `
                      text-muted-foreground
                      hover:bg-accent hover:text-accent-foreground
                    `,
                )}
              >
                <Icon className="size-5" />
              </Link>
            )}
          />
          <TooltipContent
            side="right"
            className="flex items-center gap-2 font-medium"
          >
            <span>{item.title}</span>
            {item.badge && (
              <Badge
                variant={item.badgeVariant || 'secondary'}
                className="text-[10px]"
              >
                {item.badge}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onItemClick}
        className={cn(
          `
            group relative flex items-center justify-between rounded-lg px-3
            py-2.5 text-sm font-medium transition-all duration-150
          `,
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : `
              text-muted-foreground
              hover:bg-accent hover:text-accent-foreground
            `,
        )}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={cn(
              `
                size-4 shrink-0 transition-transform duration-200
                group-hover:scale-110
              `,
              isActive
                ? 'text-primary-foreground'
                : `text-muted-foreground`,
            )}
          />
          <span className="truncate">{item.title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {item.badge && (
            <Badge
              variant={item.badgeVariant || 'secondary'}
              className={cn(
                'px-1.5 py-0.5 text-[10px]',
                isActive
                  ? `bg-primary-foreground/20 text-primary-foreground`
                  : '',
              )}
            >
              {item.badge}
            </Badge>
          )}
          <ChevronRight
            className={cn(
              `
                size-3.5 opacity-0 transition-all duration-200
                group-hover:opacity-100
              `,
              isActive
                ? 'opacity-100 text-primary-foreground'
                : `text-muted-foreground`,
            )}
          />
        </div>
      </Link>
    );
  };

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          `
            flex flex-col border-r bg-card/80 backdrop-blur-md transition-all
            duration-300 ease-in-out
          `,
          isCollapsed ? 'w-16' : 'w-64',
          className,
        )}
      >
        {/* Sidebar Header / Brand */}
        <div className="flex h-16 items-center border-b px-4">
          <Link
            to="/admin"
            className="
              flex items-center gap-3 transition-opacity
              hover:opacity-90
            "
            onClick={onItemClick}
          >
            <div className="
              flex size-9 shrink-0 items-center justify-center rounded-xl
              bg-primary text-primary-foreground shadow-sm shadow-primary/20
            "
            >
              <ShieldCheck className="size-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="
                  truncate text-xs font-bold tracking-wider
                  text-muted-foreground
                "
                >
                  GATEHOUSE
                </span>
                <span className="
                  truncate text-sm font-semibold tracking-tight text-foreground
                "
                >
                  관리자 콘솔
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Content with Groups */}
        <div className="flex-1 overflow-y-auto p-3 scrollbar-none">
          <nav className="space-y-6">
            <div className="space-y-1">
              {renderNavItem(dashboardNavItem)}
            </div>

            {/* Nav Groups */}
            {adminNavGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {!isCollapsed && (
                  <h3 className="
                    px-3 text-[11px] font-semibold uppercase tracking-wider
                    text-muted-foreground/70
                  "
                  >
                    {group.groupLabel}
                  </h3>
                )}

                <div className="space-y-1">
                  {group.items.map((item) => renderNavItem(item))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  );
}
