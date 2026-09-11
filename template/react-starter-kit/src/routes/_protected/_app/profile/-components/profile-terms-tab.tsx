import { formatDateTime } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, FileText, History } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { toast } from 'sonner';

import { useAuthControllerSyncAnalyticsConsent } from '#/.generated/api/endpoints/auth/auth';
import { getTermsControllerGetAgreementsQueryKey, useTermsControllerSetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { SetAgreementsRequestDto, TermAgreementItemDto } from '#/.generated/api/model';
import { Badge, Button, Checkbox } from '#/.generated/shadcn/components/ui';
import { openDialog } from '#/components/dialog';
import { ActionCard, SectionCard } from '#/components/layout';
import { hasAnalyticsConsent, setAnalyticsConsent, subscribeToConsent } from '#/core/analytics/ga4';
import { useI18n } from '#/hooks';
import { AgreementHistoryDialog } from '#/routes/_protected/_app/profile/-components/agreement-history-dialog';

export function ProfileTermsTab({
  agreements,
  onSelectTerm,
}: {
  agreements: TermAgreementItemDto[]
  onSelectTerm: (term: TermAgreementItemDto) => void
}) {
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
    try {
      const payload: SetAgreementsRequestDto = {
        agreements: [{ id: termId, isAgreed: !currentAgreed }],
      };
      await setAgreementsMutation.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAgreementsQueryKey() });
      toast.success(t('profile.termUpdatedSuccess'));
    }
    catch (error) {
      console.error('Failed to update agreement:', error);
      toast.error(t('profile.termUpdateFailed'));
    }
  };

  const handleToggleAllMarketingChannels = async (term: TermAgreementItemDto, currentAgreed: boolean) => {
    const nextAgreed = !currentAgreed;
    const nextChannels = {
      email: nextAgreed,
      sms: nextAgreed,
      messenger: nextAgreed,
    };
    try {
      const payload: SetAgreementsRequestDto = {
        agreements: [
          {
            id: term.id,
            isAgreed: nextAgreed,
            metadata: { channels: nextChannels },
          },
        ],
      };
      await setAgreementsMutation.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAgreementsQueryKey() });
      toast.success(t('profile.termUpdatedSuccess'));
    }
    catch (error) {
      console.error('Failed to update marketing agreement:', error);
      toast.error(t('profile.termUpdateFailed'));
    }
  };

  const handleChannelToggle = async (
    term: TermAgreementItemDto,
    channelKey: 'email' | 'sms' | 'messenger',
    nextChecked: boolean,
  ) => {
    const currentChannels = {
      email: Boolean(term.metadata?.channels?.email),
      sms: Boolean(term.metadata?.channels?.sms),
      messenger: Boolean(term.metadata?.channels?.messenger),
    };
    const nextChannels = {
      ...currentChannels,
      [channelKey]: nextChecked,
    };
    const hasAnyAgreed = Object.values(nextChannels).some(Boolean);

    try {
      const payload: SetAgreementsRequestDto = {
        agreements: [
          {
            id: term.id,
            isAgreed: hasAnyAgreed,
            metadata: { channels: nextChannels },
          },
        ],
      };
      await setAgreementsMutation.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAgreementsQueryKey() });
      toast.success(t('profile.termUpdatedSuccess'));
    }
    catch (error) {
      console.error('Failed to update marketing channels:', error);
      toast.error(t('profile.termUpdateFailed'));
    }
  };

  const handleToggleAnalyticsConsent = async (currentGranted: boolean) => {
    const nextGranted = !currentGranted;
    try {
      setAnalyticsConsent(nextGranted);
      await syncConsentMutation.mutateAsync({ data: {} });
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
          <div className="grid gap-3">
            {agreements.map((term) => (
              <TermItemCard
                key={term.id}
                term={term}
                isPending={setAgreementsMutation.isPending}
                onSelectTerm={onSelectTerm}
                onToggleTerm={handleToggleTerm}
                onToggleAllMarketingChannels={handleToggleAllMarketingChannels}
                onChannelToggle={handleChannelToggle}
              />
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

function TermItemCard({
  term,
  isPending,
  onSelectTerm,
  onToggleTerm,
  onToggleAllMarketingChannels,
  onChannelToggle,
}: {
  term: TermAgreementItemDto
  isPending: boolean
  onSelectTerm: (term: TermAgreementItemDto) => void
  onToggleTerm: (termId: string, currentAgreed: boolean) => Promise<void>
  onToggleAllMarketingChannels: (term: TermAgreementItemDto, currentAgreed: boolean) => Promise<void>
  onChannelToggle: (term: TermAgreementItemDto, channelKey: 'email' | 'sms' | 'messenger', nextChecked: boolean) => Promise<void>
}) {
  const { t } = useI18n();
  const isMarketing = term.code === 'marketing-agree';
  const channels = term.metadata?.channels ?? {};

  return (
    <div className="
      rounded-xl border border-border/70 bg-card/40 p-3 transition-colors
      hover:bg-card/70
    "
    >
      <div className="
        flex flex-col justify-between gap-3
        sm:flex-row sm:items-center
      "
      >
        <div className="flex items-center gap-3">
          <div className="
            flex size-9 shrink-0 items-center justify-center rounded-lg
            bg-primary/10 text-primary
          "
          >
            <FileText className="size-5" />
          </div>
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {term.title}
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {formatVersion(term.version)}
              </Badge>
              <Badge
                variant={term.isRequired ? 'default' : 'secondary'}
                className="text-[10px] font-bold"
              >
                {term.isRequired ? t('profile.requiredBadge') : t('profile.optionalBadge')}
              </Badge>
            </div>
            {term.createdAt && (
              <p className="text-xs text-muted-foreground">
                {t('profile.statusChangedAt')}
                {' '}
                {formatDateTime(term.createdAt, 'yyyy.MM.dd HH:mm')}
              </p>
            )}
          </div>
        </div>

        <div className="
          flex flex-wrap items-center gap-2 self-end
          sm:self-center
        "
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTerm(term)}
          >
            <Eye className="size-4" />
            {t('profile.viewTermDetail')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void openDialog(AgreementHistoryDialog, { term }, { dialogId: `history-${term.id}` })}
          >
            <History className="size-4" />
            {t('profile.agreementHistoryTitle')}
          </Button>

          <TermStatusButton
            term={term}
            isMarketing={isMarketing}
            isPending={isPending}
            onToggleTerm={onToggleTerm}
            onToggleAllMarketingChannels={onToggleAllMarketingChannels}
          />
        </div>
      </div>

      {isMarketing && (
        <div className="mt-3 border-t border-border/50 pt-3">
          <div className="mb-2 text-xs font-semibold text-muted-foreground">
            {t('profile.marketingChannelsTitle')}
          </div>
          <div className="
            flex flex-wrap items-center justify-around gap-3 rounded-lg
            bg-muted/20 p-2.5
          "
          >
            <label className="
              flex cursor-pointer items-center gap-2 text-xs font-medium
              text-foreground
              hover:text-primary
            "
            >
              <Checkbox
                checked={Boolean(channels.email)}
                disabled={isPending}
                onCheckedChange={(checked) => void onChannelToggle(term, 'email', Boolean(checked))}
              />
              <span>{t('profile.marketingChannelEmail')}</span>
            </label>
            <label className="
              flex cursor-pointer items-center gap-2 text-xs font-medium
              text-foreground
              hover:text-primary
            "
            >
              <Checkbox
                checked={Boolean(channels.sms)}
                disabled={isPending}
                onCheckedChange={(checked) => void onChannelToggle(term, 'sms', Boolean(checked))}
              />
              <span>{t('profile.marketingChannelSms')}</span>
            </label>
            <label className="
              flex cursor-pointer items-center gap-2 text-xs font-medium
              text-foreground
              hover:text-primary
            "
            >
              <Checkbox
                checked={Boolean(channels.messenger)}
                disabled={isPending}
                onCheckedChange={(checked) => void onChannelToggle(term, 'messenger', Boolean(checked))}
              />
              <span>{t('profile.marketingChannelMessenger')}</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function TermStatusButton({
  term,
  isMarketing,
  isPending,
  onToggleTerm,
  onToggleAllMarketingChannels,
}: {
  term: TermAgreementItemDto
  isMarketing: boolean
  isPending: boolean
  onToggleTerm: (termId: string, currentAgreed: boolean) => Promise<void>
  onToggleAllMarketingChannels: (term: TermAgreementItemDto, currentAgreed: boolean) => Promise<void>
}) {
  const { t } = useI18n();

  if (term.isRequired) {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled
        title={t('profile.requiredCannotWithdraw')}
      >
        {t('profile.agreementComplete')}
      </Button>
    );
  }

  if (isMarketing) {
    return (
      <Button
        size="sm"
        variant={term.isAgreed ? 'secondary' : 'outline'}
        disabled={isPending}
        onClick={() => void onToggleAllMarketingChannels(term, term.isAgreed)}
      >
        {term.isAgreed ? t('profile.agreementComplete') : t('profile.notAgreed')}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant={term.isAgreed ? 'secondary' : 'outline'}
      disabled={isPending}
      onClick={() => void onToggleTerm(term.id, term.isAgreed)}
    >
      {term.isAgreed ? t('profile.agreementComplete') : t('profile.notAgreed')}
    </Button>
  );
}

function formatVersion(version: string) {
  return version.startsWith('v') ? version : `v${version}`;
}
