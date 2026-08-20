import { useI18n } from '@pkg/shared/web';
import { format } from 'date-fns';

import type { AuthPrincipalResponse, TermAgreementItemDto } from '#/.generated/api/model';
import { Card, CardContent } from '#/.generated/shadcn/components/ui';

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
    <Card className="p-6">
      <CardContent className="grid gap-4 p-0">
        <h3 className="text-sm font-bold">{t('profile.summaryTitle')}</h3>

        <div className="
          grid grid-cols-1 gap-4
          sm:grid-cols-3
        "
        >
          <div className="grid gap-1 rounded-xl border bg-muted/50 p-4">
            <div className="text-2xs text-muted-foreground">{t('profile.lastPasswordChange')}</div>
            <div className="text-sm font-bold">
              {passwordUpdatedAt ? format(passwordUpdatedAt, 'yyyy.MM.dd') : t('profile.noInfo')}
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
