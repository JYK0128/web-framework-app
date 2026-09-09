import type { ToOptions } from '@tanstack/react-router';
import type { IconName } from 'lucide-react/dynamic';

import type { PermissionName } from '#/core/auth/permissions';

export type MenuItemConfig = {
  titleKey: string
  descriptionKey: string
  href: NonNullable<ToOptions['to']>
  icon: IconName
  iconColor: string
  permission?: PermissionName
};

export const DASHBOARD_MENU_ITEMS: MenuItemConfig[] = [
  { titleKey: 'dashboard.announcements', descriptionKey: 'dashboard.announcementsDescription', href: '/notice', icon: 'megaphone', iconColor: 'text-blue-600 dark:text-blue-400' },
  { titleKey: 'dashboard.faq', descriptionKey: 'dashboard.faqDescription', href: '/faq', icon: 'circle-help', iconColor: 'text-teal-600 dark:text-teal-400' },
  { titleKey: 'dashboard.inquiries', descriptionKey: 'dashboard.inquiriesDescription', href: '/inquiry', icon: 'message-circle-question', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  { titleKey: 'dashboard.profileAndSessions', descriptionKey: 'dashboard.profileAndSessionsDescription', href: '/profile', icon: 'user-round', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { titleKey: 'dashboard.userManagement', descriptionKey: 'dashboard.userManagementDescription', href: '/user-management', icon: 'users', iconColor: 'text-blue-600 dark:text-blue-400', permission: 'user:manage' },
  { titleKey: 'dashboard.permissionManagement', descriptionKey: 'dashboard.permissionManagementDescription', href: '/permission-management', icon: 'key-round', iconColor: 'text-amber-600 dark:text-amber-400', permission: 'role:manage' },
  { titleKey: 'dashboard.noticeManagement', descriptionKey: 'dashboard.noticeManagementDescription', href: '/notice-management', icon: 'megaphone', iconColor: 'text-cyan-600 dark:text-cyan-400', permission: 'notice:manage' },
  { titleKey: 'dashboard.faqManagement', descriptionKey: 'dashboard.faqManagementDescription', href: '/faq-management', icon: 'message-square-quote', iconColor: 'text-emerald-600 dark:text-emerald-400', permission: 'faq:manage' },
  { titleKey: 'dashboard.inquiryManagement', descriptionKey: 'dashboard.inquiryManagementDescription', href: '/inquiry-management', icon: 'message-circle-question', iconColor: 'text-pink-600 dark:text-pink-400', permission: 'inquiry:manage' },
  { titleKey: 'dashboard.termsManagement', descriptionKey: 'dashboard.termsManagementDescription', href: '/terms-management', icon: 'file-text', iconColor: 'text-violet-600 dark:text-violet-400', permission: 'term:manage' },
  { titleKey: 'dashboard.activityLogs', descriptionKey: 'dashboard.activityLogsDescription', href: '/log-management', icon: 'activity', iconColor: 'text-orange-600 dark:text-orange-400', permission: 'log:manage' },
  { titleKey: 'dashboard.systemConfig', descriptionKey: 'dashboard.systemConfigDescription', href: '/system-management', icon: 'settings-2', iconColor: 'text-slate-600 dark:text-slate-400', permission: 'system:manage' },
];
