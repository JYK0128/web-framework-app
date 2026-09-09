import { formatDateTime } from '@pkg/shared/common';
import { Eye } from 'lucide-react';
import { useState } from 'react';

import { useTermsControllerGetAgreementHistory } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto, AgreementHistoryItemDto } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { ActionCard } from '#/components/layout';
import { AGREEMENT_HISTORY_LIMIT } from '#/configs/list.config';
import { useI18n } from '#/hooks';

type AgreementHistoryDialogProps = DialogComponentProps<void> & {
  term: AgreementDto
};

export function AgreementHistoryDialog({
  term,
  open,
  onOpenChange,
}: AgreementHistoryDialogProps) {
  const [selectedHistory, setSelectedHistory] = useState<AgreementHistoryItemDto | null>(null);
  const { data, isLoading } = useTermsControllerGetAgreementHistory(
    { limit: AGREEMENT_HISTORY_LIMIT },
    { query: { enabled: Boolean(term) } },
  );
  const history = data?.items.filter((item) => item.code === term?.code) ?? [];

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      setSelectedHistory(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {selectedHistory
          ? (
            <AgreementHistoryDetailView
              historyItem={selectedHistory}
              onBack={() => setSelectedHistory(null)}
            />
          )
          : (
            <AgreementHistoryListView
              term={term}
              history={history}
              isLoading={isLoading}
              onSelectHistory={setSelectedHistory}
              onClose={() => handleOpenChange(false)}
            />
          )}
      </DialogContent>
    </Dialog>
  );
}

function AgreementHistoryDetailView({
  historyItem,
  onBack,
}: {
  historyItem: AgreementHistoryItemDto
  onBack: () => void
}) {
  const { t } = useI18n();
  const channels = historyItem.metadata?.channels;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span>{historyItem.title}</span>
          <Badge
            variant="outline"
            className="font-mono text-xs font-normal"
          >
            {historyItem.version}
          </Badge>
        </DialogTitle>
        <DialogDescription className="font-mono text-xs">{historyItem.code}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={historyItem.isRequired ? 'default' : 'secondary'}>
            {historyItem.isRequired ? t('onboarding.required') : t('onboarding.optional')}
          </Badge>
          <Badge variant={historyItem.isAgreed ? 'default' : 'outline'}>
            {historyItem.isAgreed ? t('profile.agreementComplete') : t('profile.notAgreed')}
          </Badge>
          <span className="text-muted-foreground">
            {t('profile.agreementChangedAt')}
            {': '}
            {formatDateTime(historyItem.createdAt)}
          </span>
        </div>
        {historyItem.code === 'marketing-agree' && channels && (
          <div className="
            flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-2.5 text-xs
          "
          >
            <span className="font-semibold text-muted-foreground">
              {t('profile.marketingChannelsTitle')}
            </span>
            <div className="flex flex-wrap gap-2">
              <Badge variant={channels.email ? 'secondary' : 'outline'}>
                {t('profile.marketingChannelEmail')}
                {': '}
                {channels.email ? t('profile.agreementComplete') : t('profile.notAgreed')}
              </Badge>
              <Badge variant={channels.sms ? 'secondary' : 'outline'}>
                {t('profile.marketingChannelSms')}
                {': '}
                {channels.sms ? t('profile.agreementComplete') : t('profile.notAgreed')}
              </Badge>
              <Badge variant={channels.messenger ? 'secondary' : 'outline'}>
                {t('profile.marketingChannelMessenger')}
                {': '}
                {channels.messenger ? t('profile.agreementComplete') : t('profile.notAgreed')}
              </Badge>
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <h3 className="text-sm font-semibold">{t('profile.termsContent')}</h3>
          <div className="
            scroll-y max-h-[50vh] whitespace-pre-wrap rounded-md border
            bg-muted/20 text-sm/6
          "
          >
            {historyItem.content}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onBack}>{t('app.dialog.close')}</Button>
      </DialogFooter>
    </>
  );
}

function AgreementHistoryListView({
  term,
  history,
  isLoading,
  onSelectHistory,
  onClose,
}: {
  term: AgreementDto
  history: AgreementHistoryItemDto[]
  isLoading: boolean
  onSelectHistory: (item: AgreementHistoryItemDto) => void
  onClose: () => void
}) {
  const { t } = useI18n();

  return (
    <>
      <DialogHeader>
        <DialogTitle>{term?.title}</DialogTitle>
        <DialogDescription>{t('profile.agreementHistoryDescription')}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        {isLoading && <p className="text-sm text-muted-foreground">{t('profile.loading')}</p>}
        {!isLoading && history.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('profile.noAgreementHistory')}</p>
        )}
        {history.map((item) => (
          <ActionCard
            key={item.id}
            icon="file-text"
            title={item.version}
            description={formatDateTime(item.createdAt)}
          >
            {item.code === 'marketing-agree' && item.metadata?.channels && (
              <div className="mt-1 flex flex-wrap gap-1">
                {item.metadata.channels.email && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {t('profile.marketingChannelEmail')}
                  </Badge>
                )}
                {item.metadata.channels.sms && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {t('profile.marketingChannelSms')}
                  </Badge>
                )}
                {item.metadata.channels.messenger && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {t('profile.marketingChannelMessenger')}
                  </Badge>
                )}
              </div>
            )}
            <ActionCard.Actions>
              <Badge
                variant={item.isAgreed ? 'default' : 'outline'}
                className="text-2xs"
              >
                {item.isAgreed ? t('profile.agreementComplete') : t('profile.notAgreed')}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => onSelectHistory(item)}>
                <Eye className="size-3.5" />
                {t('profile.viewTerms')}
              </Button>
            </ActionCard.Actions>
          </ActionCard>
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>{t('app.dialog.close')}</Button>
      </DialogFooter>
    </>
  );
}
