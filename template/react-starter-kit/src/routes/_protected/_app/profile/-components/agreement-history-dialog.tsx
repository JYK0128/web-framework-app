import { formatDateTime } from '@pkg/shared/common';
import { Eye } from 'lucide-react';
import { useState } from 'react';

import { useTermsControllerGetAgreementHistory } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto, AgreementHistoryItemDto } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { ActionCard } from '#/components/app';
import { useI18n } from '#/hooks';

type AgreementHistoryDialogProps = {
  term: AgreementDto | null
  onClose: () => void
};

export function AgreementHistoryDialog({ term, onClose }: AgreementHistoryDialogProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(Boolean(term));
  const [selectedHistory, setSelectedHistory] = useState<AgreementHistoryItemDto | null>(null);
  const { data, isLoading } = useTermsControllerGetAgreementHistory(
    { limit: 100 },
    { query: { enabled: Boolean(term) } },
  );
  const history = data?.items.filter((item) => item.code === term?.code) ?? [];

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent onAnimationEnd={() => !open && onClose()}>
        {selectedHistory
          ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{selectedHistory.title}</span>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs font-normal"
                  >
                    {selectedHistory.version}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="font-mono text-xs">{selectedHistory.code}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={selectedHistory.isRequired ? 'default' : 'secondary'}>
                    {selectedHistory.isRequired ? t('onboarding.required') : t('onboarding.optional')}
                  </Badge>
                  <Badge variant={selectedHistory.isAgreed ? 'default' : 'outline'}>
                    {selectedHistory.isAgreed ? t('profile.agreementComplete') : t('profile.notAgreed')}
                  </Badge>
                  <span className="text-muted-foreground">
                    {t('profile.agreementChangedAt')}
                    {': '}
                    {formatDateTime(selectedHistory.createdAt)}
                  </span>
                </div>
                <div className="grid gap-2">
                  <h3 className="text-sm font-semibold">{t('terms.fields.content')}</h3>
                  <div className="
                    max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-md
                    border bg-muted/20 text-sm/6
                  "
                  >
                    {selectedHistory.content}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedHistory(null)}>{t('common.close')}</Button>
              </DialogFooter>
            </>
          )
          : (
            <>
              <DialogHeader>
                <DialogTitle>{term?.title}</DialogTitle>
                <DialogDescription>{t('profile.agreementHistoryDescription')}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                {isLoading && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}
                {!isLoading && history.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('profile.noAgreementHistory')}</p>
                )}
                {history.map((item) => (
                  <ActionCard
                    key={item.id}
                    icon="file-text"
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{item.version}</span>
                        <Badge variant={item.isAgreed ? 'default' : 'outline'} className="text-2xs">
                          {item.isAgreed ? t('profile.agreementComplete') : t('profile.notAgreed')}
                        </Badge>
                      </div>
                    }
                    description={formatDateTime(item.createdAt)}
                  >
                    <ActionCard.Actions>
                      <Button variant="outline" size="sm" onClick={() => setSelectedHistory(item)}>
                        <Eye className="size-3.5" />
                        {t('terms.view')}
                      </Button>
                    </ActionCard.Actions>
                  </ActionCard>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>{t('common.close')}</Button>
              </DialogFooter>
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}
