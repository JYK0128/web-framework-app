import { useI18n } from '@pkg/shared/web';
import { format } from 'date-fns';

import type { AuthPrincipalResponse, TermAgreementItemDto } from '#/.generated/api/model';
import { Card, CardContent, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

type QuickSummaryCardProps = {
  user: AuthPrincipalResponse
  agreements?: TermAgreementItemDto[]
};

export function QuickSummaryCard({ user, agreements = [] }: QuickSummaryCardProps) {
  const { t } = useI18n();

  const passwordUpdatedAt = user.passwordUpdatedAt ? new Date(user.passwordUpdatedAt) : null;

  const totalAgreements = agreements.length;
  const agreedCount = agreements.filter((a) => a.isAgreed).length;
  const isTwoFactorEnabled = Boolean(user.twoFactorEnabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.summaryTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="
          grid grid-cols-1 gap-4
          sm:grid-cols-3
        "
        >
          <div className="flex flex-col gap-1 rounded-lg border p-3.5">
            <span className="text-xs text-muted-foreground">{t('profile.lastPasswordChange')}</span>
            <span className="text-sm font-semibold">
              {passwordUpdatedAt ? format(passwordUpdatedAt, 'yyyy.MM.dd') : t('profile.noInfo')}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-lg border p-3.5">
            <span className="text-xs text-muted-foreground">{t('profile.termsCompleted')}</span>
            <span className="text-sm font-semibold">
              {t('profile.agreementCount', { agreed: agreedCount, total: totalAgreements })}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-lg border p-3.5">
            <span className="text-xs text-muted-foreground">{t('profile.twoFactorSecurity')}</span>
            <span className="text-sm font-semibold">
              {isTwoFactorEnabled ? t('profile.twoFactorActive') : t('profile.twoFactorInactive')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
