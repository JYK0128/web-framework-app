import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { isString } from 'lodash-es';
import { Bell, CheckCheck, Info, Megaphone, MessageSquare, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { getAlertsControllerGetMyAlertsQueryKey, useAlertsControllerDeleteAlert, useAlertsControllerGetMyAlerts, useAlertsControllerMarkAlertRead, useAlertsControllerMarkAllAlertsRead } from '#/.generated/api/endpoints/alerts/alerts';
import type { AlertItemDto } from '#/.generated/api/model';
import { Badge, Button, Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '#/.generated/shadcn/components/ui';

function formatAlertDate(value: string, locale: string): string {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return locale.startsWith('ko') ? '방금 전' : 'Just now';
  if (diffMins < 60) return locale.startsWith('ko') ? `${diffMins}분 전` : `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return locale.startsWith('ko') ? `${diffHours}시간 전` : `${diffHours}h ago`;

  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getAlertIcon(type: string) {
  switch (type) {
    case 'inquiry_reply':
    case 'inquiry_message':
      return <MessageSquare className="size-4 text-primary shrink-0" />;
    case 'notice':
      return <Megaphone className="size-4 text-amber-500 shrink-0" />;
    default:
      return <Info className="size-4 text-muted-foreground shrink-0" />;
  }
}

export function AlertBell() {
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useAlertsControllerGetMyAlerts({ limit: 50 });
  const markReadMutation = useAlertsControllerMarkAlertRead();
  const markAllReadMutation = useAlertsControllerMarkAllAlertsRead();
  const deleteAlertMutation = useAlertsControllerDeleteAlert();

  const rawAlerts = data?.items ?? [];
  const unreadAlerts = rawAlerts.filter((a) => !a.isRead);
  const unreadCount = data?.unreadCount ?? unreadAlerts.length;

  const handleToastAction = useCallback((newAlert: AlertItemDto) => {
    void (async () => {
      try {
        await markReadMutation.mutateAsync({ id: newAlert.id });
        await queryClient.invalidateQueries({ queryKey: getAlertsControllerGetMyAlertsQueryKey() });
      }
      catch {
        // Ignored
      }
      if (isString(newAlert.linkUrl) && newAlert.linkUrl) {
        await navigate({ href: newAlert.linkUrl });
      }
    })();
  }, [markReadMutation, queryClient, navigate]);

  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io('/alerts', {
        path: '/api/v1/socket.io',
        transports: ['websocket'],
        upgrade: false,
        withCredentials: true,
      });

      socket.on('alert-received', (newAlert: AlertItemDto) => {
        void queryClient.invalidateQueries({ queryKey: getAlertsControllerGetMyAlertsQueryKey() });
        const linkUrl = isString(newAlert.linkUrl) ? newAlert.linkUrl : '';
        toast.info(newAlert.title, {
          id: `alert-${newAlert.id}`,
          description: newAlert.content,
          action: linkUrl
            ? {
              label: language.startsWith('ko') ? '확인' : 'View',
              onClick: () => handleToastAction(newAlert),
            }
            : undefined,
        });
      });
    }
    catch {
      // Ignored
    }

    return () => {
      if (socket) {
        socket.io.opts.reconnection = false;
        socket.off('alert-received');
        if (socket.connected) {
          socket.disconnect();
        }
        else {
          socket.once('connect', () => socket.disconnect());
        }
      }
    };
  }, [queryClient, language, handleToastAction]);

  const handleAlertClick = (alert: AlertItemDto) => {
    setOpen(false);
    void (async () => {
      try {
        if (!alert.isRead) {
          await markReadMutation.mutateAsync({ id: alert.id });
          await queryClient.invalidateQueries({ queryKey: getAlertsControllerGetMyAlertsQueryKey() });
        }
      }
      catch {
        // Ignored
      }

      if (isString(alert.linkUrl) && alert.linkUrl) {
        await navigate({ href: alert.linkUrl });
      }
    })();
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0 || markAllReadMutation.isPending) return;
    void (async () => {
      try {
        await markAllReadMutation.mutateAsync();
        await queryClient.invalidateQueries({ queryKey: getAlertsControllerGetMyAlertsQueryKey() });
      }
      catch {
        // Ignored
      }
    })();
  };

  const handleDeleteAlert = (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    void (async () => {
      try {
        await deleteAlertMutation.mutateAsync({ id: alertId });
        await queryClient.invalidateQueries({ queryKey: getAlertsControllerGetMyAlertsQueryKey() });
      }
      catch {
        // Ignored
      }
    })();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="icon"
            className="relative"
            aria-label={t('alerts.openAlerts')}
            title={t('alerts.openAlerts')}
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

      <PopoverContent align="end">
        <PopoverHeader className="
          flex flex-row items-center justify-between border-b px-4 py-3
        "
        >
          <div className="flex items-center gap-2">
            <PopoverTitle
              className="text-sm font-bold"
            >
              {t('alerts.title')}
            </PopoverTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[11px]">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadAlerts.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllReadMutation.isPending}
              className="
                h-7 text-xs text-muted-foreground
                hover:text-foreground
              "
            >
              <CheckCheck className="mr-1 size-3.5" />
              {t('alerts.markAllAsRead')}
            </Button>
          )}
        </PopoverHeader>

        <div className="scroll-y max-h-[380px]">
          {unreadAlerts.length === 0
            ? (
              <div className="
                flex flex-col items-center justify-center py-10 text-center
                text-sm text-muted-foreground
              "
              >
                <Bell className="mb-2 size-8 opacity-40" />
                <p>{t('alerts.noAlerts')}</p>
              </div>
            )
            : (
              <div className="divide-y">
                {unreadAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className="
                      group relative flex cursor-pointer items-start gap-3 p-3.5
                      text-left transition-colors
                      hover:bg-muted/60
                    "
                  >
                    <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`
                          text-xs truncate
                          ${!alert.isRead
                    ? `font-semibold text-foreground`
                    : `font-medium text-foreground/80`}
                        `}
                        >
                          {alert.title}
                        </p>
                        <span className="
                          text-[11px] text-muted-foreground whitespace-nowrap
                        "
                        >
                          {formatAlertDate(alert.createdAt, language)}
                        </span>
                      </div>
                      <p className="
                        mt-1 line-clamp-2 text-xs text-muted-foreground
                      "
                      >
                        {alert.content}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteAlert(e, alert.id)}
                      className="
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity text-muted-foreground
                        hover:text-destructive
                        p-1 rounded-sm
                      "
                      title={t('alerts.delete')}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
