import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { History } from 'lucide-react';
import { useState } from 'react';

import { getTermsControllerGetAgreementsQueryKey, useTermsControllerSetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { ActionCard } from '#/components/app/action-card';
import { SectionCard } from '#/components/app/section-card';
import { AgreementHistoryDialog } from '#/routes/_protected/_app/profile/-components/agreement-history-dialog';
import type { UserTermDetailItem } from '#/routes/_protected/_app/profile/-components/user-term-detail-dialog';

export function ProfileTermsTab({ agreements, onSelectTerm }: { agreements: AgreementDto[], onSelectTerm: (term: UserTermDetailItem) => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const setAgreementsMutation = useTermsControllerSetAgreements();
  const [historyTerm, setHistoryTerm] = useState<AgreementDto | null>(null);

  const handleToggleTerm = async (termId: string, currentAgreed: boolean) => {
    await setAgreementsMutation.mutateAsync({
      data: { agreements: [{ id: termId, isAgreed: !currentAgreed }] },
    });
    await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAgreementsQueryKey() });
  };

  return (
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
                ? `${t('profile.statusChangedAt')} ${format(new Date(term.createdAt), 'yyyy.MM.dd HH:mm')}`
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
  );
}

function formatVersion(version: string) {
  return version.startsWith('v') ? version : `v${version}`;
}
