import { Bell } from 'lucide-react';

import { useI18n } from '#context/i18n';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '#ui';

export type NotificationItem = {
  id: string
  title: string
  description?: string
};

export type NotificationProps = {
  notifications: readonly NotificationItem[]
  onSelect?: (notification: NotificationItem) => void
};

export function Notification({ notifications, onSelect }: NotificationProps) {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="icon"
            className="
              relative hidden
              lg:inline-flex
            "
            aria-label={t('notification.open')}
          >
            <Bell className="size-4" />
            {notifications.length > 0 && (
              <span className="
                absolute -right-1 -top-1 flex size-4 items-center justify-center
                rounded-full bg-destructive text-[10px]
                text-destructive-foreground
              "
              >
                {Math.min(notifications.length, 9)}
              </span>
            )}
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="w-64">
        {notifications.length === 0
          ? <p className="p-4 text-sm text-muted-foreground">{t('notification.empty')}</p>
          : notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="
                flex h-auto cursor-pointer flex-col items-start gap-1
                whitespace-normal px-4 py-3
              "
              onClick={() => onSelect?.(notification)}
            >
              <p className="text-sm font-medium">{notification.title}</p>
              {notification.description && (
                <p className="
                  mt-1 line-clamp-3 whitespace-pre-line text-sm
                  text-muted-foreground
                "
                >
                  {notification.description}
                </p>
              )}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
