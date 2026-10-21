import { Notification, type NotificationItem } from '@pkg/web-core/application';
import { useI18n } from '@pkg/web-core/context/i18n';
import { useSSE } from '@pkg/web-core/hooks';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { isSupportChatOpen } from '~/hooks/use-support-socket';

type ServiceNotificationEvent = {
  id: string
  kind: 'support.reply'
  roomId: string
  message: string
  createdAt: string
} | {
  id: string
  kind: 'qna.answer'
  qnaId: string
  questionTitle: string
  message: string
  createdAt: string
};

export function ServiceNotifications({ userId, canAccessSupport }: { userId: string, canAccessSupport: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [notificationState, setNotificationState] = useState<{ userId: string, items: ServiceNotificationEvent[] }>({ userId, items: [] });
  const notifications = notificationState.userId === userId ? notificationState.items : [];

  useSSE<ServiceNotificationEvent>({
    url: '/api/v1/notifications/events',
    onEvent: (event) => {
      if (event.type !== 'notification.created') return;
      if (!canAccessSupport && event.data.kind === 'support.reply') return;
      if (event.data.kind === 'support.reply' && isSupportChatOpen(event.data.roomId)) return;
      setNotificationState((current) => ({
        userId,
        items: [event.data, ...(current.userId === userId ? current.items : []).filter(({ id }) => id !== event.data.id)].slice(0, 10),
      }));
    },
  });

  const items: NotificationItem[] = notifications.map((notification) => ({
    id: notification.id,
    title: t(notification.kind === 'support.reply' ? 'app.notifications.supportReply' : 'app.notifications.qnaAnswer'),
    description: notification.kind === 'support.reply'
      ? notification.message
      : `${notification.questionTitle}\n${notification.message}`,
  }));

  return (
    <Notification
      notifications={items}
      onSelect={(item) => {
        const notification = notifications.find(({ id }) => id === item.id);
        if (!notification) return;
        void navigate({ to: notification.kind === 'support.reply' ? '/support' : '/qna' });
      }}
    />
  );
}
