import { formatDateTime, when } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { toast } from 'sonner';

import { useAuthControllerSyncAnalyticsConsent } from '#/.generated/api/endpoints/auth/auth';
import { getTermsControllerGetAgreementsQueryKey, useTermsControllerSetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { ActionCard, openDialog, SectionCard } from '#/components/app';
import { hasAnalyticsConsent, setAnalyticsConsent, subscribeToConsent } from '#/core/analytics/ga4';
import { useI18n } from '#/hooks';
import { AgreementHistoryDialog } from '#/routes/_protected/_app/profile/-components/agreement-history-dialog';
import type { UserTermDetailItem } from '#/routes/_protected/_app/profile/-components/user-term-detail-dialog';

export function ProfileTermsTab({ agreements, onSelectTerm: _onSelectTerm }: { agreements: AgreementDto[], onSelectTerm: (term: UserTermDetailItem) => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const setAgreementsMutation = useTermsControllerSetAgreements();

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
                title={`${term.title} (${formatVersion(term.version)})`}
                description={when((value): value is string => Boolean(value), (createdAt) => `${t('profile.statusChangedAt')} ${formatDateTime(createdAt, 'yyyy.MM.dd HH:mm')}`)(term.createdAt)}
              >
                <ActionCard.Actions>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void openDialog(AgreementHistoryDialog, { term }, { dialogId: `history-${term.id}` })}
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
            title={t('profile.analyticsConsentLabel')}
            description={t('profile.analyticsConsentDesc')}
          >
            <ActionCard.Actions>
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
