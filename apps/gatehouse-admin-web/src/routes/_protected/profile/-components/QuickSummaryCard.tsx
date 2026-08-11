import { useI18n } from '@pkg/shared/web';
import { format } from 'date-fns';
import { Key } from 'lucide-react';

import type { TermAgreementItemDto, UserProfileResponse } from '#/.generated/api/model';
import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';

type QuickSummaryCardProps = {
  user: UserProfileResponse
  onOpenPasswordChangeModal: () => void
  agreements?: TermAgreementItemDto[]
};

export function QuickSummaryCard({ user, onOpenPasswordChangeModal, agreements = [] }: QuickSummaryCardProps) {
  const { t } = useI18n();

  const passwordUpdatedAt = user.passwordUpdatedAt ? new Date(user.passwordUpdatedAt) : null;

  const totalAgreements = agreements.length;
  const agreedCount = agreements.filter((a) => a.isAgreed).length;
  const isTwoFactorEnabled = Boolean(user.twoFactorEnabled);

  return (
    <Card className="p-6">
      <CardContent className="grid gap-4 p-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex-1">{t('profile.summaryTitle')}</h3>
          <Button
            variant="link"
            size="xs"
            onClick={onOpenPasswordChangeModal}
            className="h-auto p-0 shrink-0"
          >
            <Key className="size-3.5" />
            <span>{t('profile.changePassword')}</span>
          </Button>
        </div>

        <div className="
          grid grid-cols-1 gap-4
          sm:grid-cols-3
        "
        >
          <div className="grid gap-1 rounded-xl border bg-muted/50 p-4">
            <div className="text-2xs text-muted-foreground">{t('profile.lastPasswordChange')}</div>
            <div className="text-sm font-bold">
              {passwordUpdatedAt || user.createdAt ? format(passwordUpdatedAt ?? new Date(user.createdAt), 'yyyy.MM.dd') : t('profile.noInfo')}
            </div>
          </div>

          <div className="grid gap-1 rounded-xl border bg-muted/50 p-4">
            <div className="text-2xs text-muted-foreground">{t('profile.termsCompleted')}</div>
            <div className="text-sm font-bold">
              {t('profile.agreementCount', { agreed: agreedCount, total: totalAgreements })}
            </div>
          </div>

          <div className="grid gap-1 rounded-xl border bg-muted/50 p-4">
            <div className="text-2xs text-muted-foreground">{t('profile.securityRecommendation')}</div>
            <div className="text-sm font-bold">
              {isTwoFactorEnabled ? t('profile.securityComplete') : t('profile.twoFactorSetupRequired')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
