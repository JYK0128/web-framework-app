import { formatDateTime } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { Cookie, History } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';

import { useAuthControllerSyncAnalyticsConsent } from '#/.generated/api/endpoints/auth/auth';
import { getTermsControllerGetAgreementsQueryKey, useTermsControllerSetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { ActionCard, SectionCard } from '#/components/app';
import { hasAnalyticsConsent, setAnalyticsConsent, subscribeToConsent } from '#/core/analytics/ga4';
import { useI18n } from '#/hooks';
import { AgreementHistoryDialog } from '#/routes/_protected/_app/profile/-components/agreement-history-dialog';
import type { UserTermDetailItem } from '#/routes/_protected/_app/profile/-components/user-term-detail-dialog';

export function ProfileTermsTab({ agreements, onSelectTerm }: { agreements: AgreementDto[], onSelectTerm: (term: UserTermDetailItem) => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const setAgreementsMutation = useTermsControllerSetAgreements();
  const [historyTerm, setHistoryTerm] = useState<AgreementDto | null>(null);

  const syncConsentMutation = useAuthControllerSyncAnalyticsConsent();
  const analyticsConsent = useSyncExternalStore(
    subscribeToConsent,
    hasAnalyticsConsent,
    () => false,
  );

  const handleToggleTerm = async (termId: string, currentAgreed: boolean) => {
    await setAgreementsMutation.mutateAsync({
      data: { agreements: [{ id: termId, isAgreed: !currentAgreed }] },
    });
    await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAgreementsQueryKey() });
  };

  const handleToggleAnalyticsConsent = async (currentGranted: boolean) => {
    const nextGranted = !currentGranted;
    try {
      setAnalyticsConsent(nextGranted);
      await syncConsentMutation.mutateAsync({});
      toast.success(t('profile.consentUpdatedSuccess'));
    }
    catch (error) {
      setAnalyticsConsent(currentGranted);
      console.error('Failed to update analytics consent:', error);
    }
  };

  return (
    <div className="grid gap-6">
      {/* 1. Terms & Policies Agreement History */}
      <SectionCard
        textSize="sm"
        icon="file-text"
        title={t('profile.termsStatusTitle')}
        description={t('profile.termsStatusDescription')}
      >
        <SectionCard.Content>
          <div className="grid gap-2">
            {agreements.map((term) => (
              <ActionCard
                key={term.id}
                icon="file-text"
                iconColor="text-primary"
                variant="ghost"
                title={(
                  <button
                    type="button"
                    className="
                      flex items-center gap-2 text-left
                      hover:text-primary
                      transition-colors
                    "
                    onClick={() => onSelectTerm(term)}
                  >
                    <span className="truncate">{term.title}</span>
                    <Badge
                      variant={term.isRequired ? 'destructive' : 'secondary'}
                      className="shrink-0 text-xs"
                    >
                      {term.isRequired ? t('onboarding.required') : t('onboarding.optional')}
                    </Badge>
                    <span className="
                      shrink-0 font-mono text-xs text-muted-foreground
                    "
                    >
                      {formatVersion(term.version)}
                    </span>
                  </button>
                )}
                description={term.createdAt
                  ? `${t('profile.statusChangedAt')} ${formatDateTime(term.createdAt, 'yyyy.MM.dd HH:mm')}`
                  : undefined}
              >
                <ActionCard.Actions className="w-56 justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHistoryTerm(term)}
                  >
                    <History />
                    {t('profile.agreementHistoryTitle')}
                  </Button>
                  <Button
                    size="sm"
                    variant={term.isAgreed ? 'secondary' : 'outline'}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleToggleTerm(term.id, term.isAgreed);
                    }}
                  >
                    {term.isAgreed ? t('profile.agreementComplete') : t('profile.notAgreed')}
                  </Button>
                </ActionCard.Actions>
              </ActionCard>
            ))}

            {agreements.length === 0 && (
              <div className="text-center text-xs text-muted-foreground">
                {t('profile.noTerms')}
              </div>
            )}
          </div>
        </SectionCard.Content>
        <SectionCard.Dialogs>
          <AgreementHistoryDialog
            key={historyTerm?.id ?? 'none'}
            term={historyTerm}
            onClose={() => setHistoryTerm(null)}
          />
        </SectionCard.Dialogs>
      </SectionCard>

      {/* 2. Cookie & Tracker Preferences (CNIL Multi-Device Sync) */}
      <SectionCard
        textSize="sm"
        icon="shield"
        title={t('profile.analyticsConsentSectionTitle')}
        description={t('profile.analyticsConsentSectionDescription')}
      >
        <SectionCard.Content>
          <ActionCard
            icon="shield"
            iconColor="text-primary"
            variant="ghost"
            title={(
              <div className="flex items-center gap-2">
                <span className="font-semibold">{t('profile.analyticsConsentLabel')}</span>
                <Badge
                  variant="outline"
                  className="
                    text-xs bg-primary/10 text-primary border-primary/20
                  "
                >
                  <Cookie className="mr-1 size-3" />
                  {t('profile.multiDeviceBadge')}
                </Badge>
              </div>
            )}
            description={(
              <div className="space-y-1">
                <p>{t('profile.analyticsConsentDesc')}</p>
              </div>
            )}
          >
            <ActionCard.Actions className="w-48 justify-end">
              <Button
                size="sm"
                variant={analyticsConsent ? 'secondary' : 'outline'}
                disabled={syncConsentMutation.isPending}
                onClick={() => void handleToggleAnalyticsConsent(analyticsConsent)}
              >
                {analyticsConsent
                  ? t('profile.consentStatusGranted')
                  : t('profile.consentStatusDenied')}
              </Button>
            </ActionCard.Actions>
          </ActionCard>
        </SectionCard.Content>
      </SectionCard>
    </div>
  );
}

function formatVersion(version: string) {
  return version.startsWith('v') ? version : `v${version}`;
}
