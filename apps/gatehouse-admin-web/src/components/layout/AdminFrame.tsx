import { type ReactNode, useState } from 'react';

import { cn } from '#/.generated/shadcn/lib/utils';

import { AdminHeader } from './AdminHeader';
import { type AdminUserProfile } from './AdminProfileDropdown';
import { AdminSidebar } from './AdminSidebar';

export interface AdminFrameProps {
  children: ReactNode
  user?: AdminUserProfile
  title?: string
  className?: string
}

export function AdminFrame({ children, user, title, className }: AdminFrameProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/20">
      {/* Desktop Persistent Collapsible Sidebar */}
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        className="
          hidden
          md:flex
          shrink-0
        "
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader
          user={user}
          title={title}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Scrollable Content Body */}
        <main
          className={cn(
            `
              flex-1 overflow-y-auto overflow-x-hidden p-4
              sm:p-6
              lg:p-8
            `,
            className,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
