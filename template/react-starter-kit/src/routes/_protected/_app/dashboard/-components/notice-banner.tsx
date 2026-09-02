import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { useNoticesControllerGetNoticeFeed } from '#/.generated/api/endpoints/notices/notices';
import { NoticePriority } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { ActionCard } from '#/components/app';
import { useI18n } from '#/hooks';

export function NoticeBanner() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<Set<string>>(() => new Set());
  const { data } = useNoticesControllerGetNoticeFeed({ limit: 20 });
  const notice = data?.items.find((item) => item.priority !== NoticePriority.LOW && !dismissedNoticeIds.has(item.id));

  if (!notice) return null;

  const handleDismiss = () => {
    setDismissedNoticeIds((prev) => new Set(prev).add(notice.id));
  };

  const handleNavigateToDetail = () => {
    void navigate({
      to: '/notice',
      search: { noticeId: notice.id },
    });
  };

  const isUrgent = notice.priority === NoticePriority.HIGH;

  return (
    <ActionCard
      icon={isUrgent ? 'alert-triangle' : 'megaphone'}
      iconColor={isUrgent ? 'text-destructive' : 'text-primary'}
      title={notice.title}
      className={isUrgent
        ? 'border-destructive/25 bg-destructive/10'
        : `border-primary/20 bg-primary/5`}
    >
      <ActionCard.Badge>
        <Badge
          variant={isUrgent ? 'destructive' : 'outline'}
        >
          {isUrgent ? t('notices.urgent') : t('notices.important')}
        </Badge>
      </ActionCard.Badge>

      <ActionCard.Actions>
        <Button
          variant="ghost"
          onClick={handleNavigateToDetail}
        >
          {t('notices.viewDetails')}
        </Button>
        <Button
          variant="ghost"
          onClick={handleDismiss}
          title={t('common.close')}
        >
          ×
        </Button>
      </ActionCard.Actions>
    </ActionCard>
  );
}
