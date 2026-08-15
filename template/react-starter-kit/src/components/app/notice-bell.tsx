import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';

import { useNoticesControllerGetNoticeFeed, useNoticesControllerMarkAllNoticesRead, useNoticesControllerMarkNoticeRead } from '#/.generated/api/endpoints/notices/notices';
import type { NoticeFeedItemDto } from '#/.generated/api/model';
import { Badge, Button, Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger, ScrollArea } from '#/.generated/shadcn/components/ui';

import { NoticeDetailDialog } from './notice-detail-dialog';

function formatNoticeDate(value: string, locale: string): string {
  return new Date(value).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function NoticeBell() {
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<NoticeFeedItemDto | null>(null);
  const { data } = useNoticesControllerGetNoticeFeed({ limit: 100 });
  const markReadMutation = useNoticesControllerMarkNoticeRead();
  const markAllReadMutation = useNoticesControllerMarkAllNoticesRead();
  const notices = data?.items ?? [];
  const unreadNotices = notices.filter((notice) => !notice.isRead);
  const unreadCount = unreadNotices.length;

  const openNoticeDetail = async (notice: NoticeFeedItemDto) => {
    let detail = notice;

    try {
      if (!notice.isRead) {
        await markReadMutation.mutateAsync({ id: notice.id });
        await queryClient.invalidateQueries({ queryKey: ['/api/v1/notices/feed'] });
        await queryClient.invalidateQueries({ queryKey: ['notice-feed-cursor'] });
        detail = { ...notice, isRead: true };
      }
    }
    catch {
      // Keep the detail view available even when marking as read fails.
    }

    setOpen(false);
    setSelectedNotice(detail);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markAllReadMutation.isPending) return;
    try {
      await markAllReadMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: ['/api/v1/notices/feed'] });
      await queryClient.invalidateQueries({ queryKey: ['notice-feed-cursor'] });
    }
    catch {
      try {
        await Promise.all(unreadNotices.map((notice) => markReadMutation.mutateAsync({ id: notice.id })));
        await queryClient.invalidateQueries({ queryKey: ['/api/v1/notices/feed'] });
        await queryClient.invalidateQueries({ queryKey: ['notice-feed-cursor'] });
      }
      catch {
        // ignore
      }
    }
  };

  const openNoticeBoard = async () => {
    setOpen(false);
    await navigate({ to: '/announcements' });
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              variant="outline"
              size="icon"
              className="relative size-9"
              aria-label={t('notices.openNotifications')}
              title={t('notices.openNotifications')}
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span
                  className="
                    absolute -top-1 -right-1 flex h-4 min-w-4 items-center
                    justify-center rounded-full bg-destructive px-1 text-[10px]
                    font-semibold text-destructive-foreground shadow-xs
                  "
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          )}
        />
        <PopoverContent
          align="end"
          className="w-[min(24rem,calc(100vw-2rem))] p-0"
        >
          <PopoverHeader className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PopoverTitle>{t('notices.notificationTitle')}</PopoverTitle>
                {unreadCount > 0 && <Badge variant="secondary">{unreadCount}</Badge>}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={markAllReadMutation.isPending}
                  onClick={() => void handleMarkAllAsRead()}
                  className="
                    h-7 text-xs font-normal text-muted-foreground
                    hover:text-foreground
                  "
                >
                  <CheckCheck className="mr-1 size-3.5" />
                  {t('notices.markAllAsRead')}
                </Button>
              )}
            </div>
          </PopoverHeader>
          <ScrollArea className="max-h-96">
            <div className="grid gap-1 p-2">
              {unreadNotices.slice(0, 10).map((notice) => (
                <Button
                  key={notice.id}
                  type="button"
                  variant="ghost"
                  className="
                    grid h-auto min-h-0 w-full items-start justify-start gap-1
                    rounded-md p-3 text-left font-normal whitespace-normal
                    transition-colors
                    hover:bg-muted
                  "
                  onClick={() => void openNoticeDetail(notice)}
                >
                  <div className="flex items-start gap-2">
                    <span className="
                      mt-1.5 size-2 shrink-0 rounded-full bg-primary
                    "
                    />
                    <span className="text-sm font-semibold">
                      {notice.title}
                    </span>
                  </div>
                  <span className="
                    line-clamp-2 pl-4 text-xs text-muted-foreground
                  "
                  >
                    {notice.content}
                  </span>
                  <span className="pl-4 text-[11px] text-muted-foreground">
                    {formatNoticeDate(
                      notice.publishedAt ?? notice.createdAt,
                      language.startsWith('ko') ? 'ko-KR' : 'en-US',
                    )}
                  </span>
                </Button>
              ))}
              {unreadNotices.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  {t('notices.noUnreadNotifications')}
                </p>
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-2">
            <Button variant="ghost" className="w-full" onClick={() => void openNoticeBoard()}>
              {t('notices.viewAll')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <NoticeDetailDialog
        open={Boolean(selectedNotice)}
        notice={selectedNotice}
        onOpenChange={(nextOpen) => !nextOpen && setSelectedNotice(null)}
      />
    </>
  );
}
