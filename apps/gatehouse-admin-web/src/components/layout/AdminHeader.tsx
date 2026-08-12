import { Link, useLocation } from '@tanstack/react-router';
import { Bell, ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge, Button, Input, Sheet, SheetContent, SheetTitle, SheetTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#/.generated/shadcn/components/ui';

import { AdminProfileDropdown, type AdminUserProfile } from './AdminProfileDropdown';
import { adminNavGroups, AdminSidebar } from './AdminSidebar';

interface AdminHeaderProps {
  user?: AdminUserProfile
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  title?: string
}

export function AdminHeader({
  user,
  isSidebarCollapsed = false,
  onToggleSidebar,
  title,
}: AdminHeaderProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Derive breadcrumbs based on current pathname
  const currentTitle = useMemo(() => {
    if (title) return title;

    for (const group of adminNavGroups) {
      for (const item of group.items) {
        if (item.href === location.pathname) {
          return item.title;
        }
      }
    }
    if (location.pathname.startsWith('/profile')) return '내 프로필';
    if (location.pathname.startsWith('/admin')) return '사용자 관리';
    return '관리자 대시보드';
  }, [location.pathname, title]);

  return (
    <header className="
      sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b
      bg-background/95 px-4 backdrop-blur-md
      supports-[backdrop-filter]:bg-background/70
      sm:px-6
    "
    >
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Trigger (Sheet Drawer) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={(props) => (
              <Button
                {...props}
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="모바일 메뉴 열기"
              >
                <Menu className="size-5" />
              </Button>
            )}
          />
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">관리자 메뉴</SheetTitle>
            <AdminSidebar onItemClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar Toggle Button */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger
              render={(props) => (
                <Button
                  {...props}
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidebar}
                  className="
                    hidden
                    md:inline-flex
                  "
                  aria-label={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
                >
                  {isSidebarCollapsed
                    ? (
                      <PanelLeftOpen className="
                        size-5 text-muted-foreground transition-colors
                        hover:text-foreground
                      "
                      />
                    )
                    : (
                      <PanelLeftClose className="
                        size-5 text-muted-foreground transition-colors
                        hover:text-foreground
                      "
                      />
                    )}
                </Button>
              )}
            />
            <TooltipContent side="bottom">
              {isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Brand & Breadcrumbs */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="
              flex items-center gap-2 font-bold tracking-tight text-foreground
              md:hidden
            "
          >
            <div className="
              flex size-8 items-center justify-center rounded-lg bg-primary
              text-primary-foreground
            "
            >
              <ShieldCheck className="size-4" />
            </div>
            <span className="text-sm">GATEHOUSE</span>
          </Link>

          <div className="
            hidden items-center gap-2
            sm:flex
          "
          >
            <span className="text-xs font-semibold text-muted-foreground">관리자</span>
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
            <h1 className="text-sm font-semibold tracking-tight text-foreground">{currentTitle}</h1>
          </div>
        </div>
      </div>

      {/* Center/Right Status & Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <div className="
          relative hidden
          lg:block
          w-48
          xl:w-64
        "
        >
          <Search className="
            pointer-events-none absolute left-2.5 top-1/2 size-3.5
            -translate-y-1/2 text-muted-foreground
          "
          />
          <Input
            type="search"
            placeholder="빠른 검색... (Ctrl+K)"
            className="
              h-8 pl-8 text-xs bg-muted/30
              focus-visible:bg-background
            "
          />
        </div>

        {/* Live Status Badge */}
        <div className="
          hidden
          sm:flex
          items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1
          text-xs text-muted-foreground
        "
        >
          <span className="relative flex size-2">
            <span className="
              absolute inline-flex size-full animate-ping rounded-full
              bg-emerald-400 opacity-75
            "
            />
            <span className="
              relative inline-flex size-2 rounded-full bg-emerald-500
            "
            />
          </span>
          <span className="font-medium text-foreground text-[11px]">시스템 정상</span>
        </div>

        {/* Notification Bell */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger
              render={(props) => (
                <Button
                  {...props}
                  variant="ghost"
                  size="icon"
                  className="
                    relative text-muted-foreground
                    hover:text-foreground
                  "
                  aria-label="알림 목록"
                >
                  <Bell className="size-4" />
                  <Badge
                    variant="destructive"
                    className="
                      absolute -right-0.5 -top-0.5 size-4 p-0 flex items-center
                      justify-center text-[9px]
                    "
                  >
                    2
                  </Badge>
                </Button>
              )}
            />
            <TooltipContent side="bottom">새로운 알림 2건</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Divider */}
        <div className="
          h-4 w-px bg-border hidden
          sm:block
        "
        />

        {/* Profile Button Dropdown */}
        <AdminProfileDropdown user={user} />
      </div>
    </header>
  );
}
