import { useI18n } from '@pkg/shared/web';
import { Link } from '@tanstack/react-router';
import { Settings2 } from 'lucide-react';

import type { OperatingStatusDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { ActionCard } from '#/components/app/action-card';
import { getOperatingStatusMessage, OPERATING_STATUS_ICONS, operatingStatusBadgeVariants, operatingStatusIconVariants, toOperatingStatus } from '#/routes/_protected/_app/dashboard/-configs/dashboard-status.config';

type OperatingStatusCardProps = {
  operatingStatus: OperatingStatusDto
  canManage: boolean
};

export function OperatingStatusCard({ operatingStatus, canManage }: OperatingStatusCardProps) {
  const { i18n, t } = useI18n();
  const status = toOperatingStatus(operatingStatus.code);
  const message = getOperatingStatusMessage(
    operatingStatus.message,
    i18n.language,
    t('dashboard.supportOperatingDefaultMessage'),
  );

  return (
    <ActionCard
      icon={OPERATING_STATUS_ICONS[status]}
      iconColor={operatingStatusIconVariants({ status })}
      title={t('dashboard.supportOperatingStatus')}
      description={message}
      className="bg-card/60 shadow-xs backdrop-blur-xs"
    >
      <ActionCard.Badge>
        <Badge
          variant={operatingStatusBadgeVariants[status]}
        >
          {t(`dashboard.operatingStatuses.${status}`)}
        </Badge>
      </ActionCard.Badge>

      {canManage && (
        <ActionCard.Actions>
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link to="/system-management" />}
          >
            <Settings2 className="size-3.5" />
            {t('dashboard.manageOperatingSettings')}
          </Button>
        </ActionCard.Actions>
      )}
    </ActionCard>
  );
}
