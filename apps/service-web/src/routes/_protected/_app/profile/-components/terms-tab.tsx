import { useQueryClient } from '@tanstack/react-query';

import { getServiceTermsControllerGetAgreementHistoryV1QueryKey, getServiceTermsControllerGetAgreementsV1QueryKey, useServiceTermsControllerSetAgreementsV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import type { ServiceTermAgreementItem } from '#/.generated/api/model';
import { Button, Checkbox } from '#/.generated/shadcn/components/ui';
import { ActionCard, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { receptionOptionLabel } from '#/components/terms/reception-options';
import { OnboardingTermDetailModal } from '#/routes/_protected/_global/onboarding/-components/term-detail-modal';

import { AgreementHistoryModal } from './agreement-history-modal';

export function ProfileTermsTab({ agreements }: { agreements: ServiceTermAgreementItem[] }) {
  const queryClient = useQueryClient();
  const mutation = useServiceTermsControllerSetAgreementsV1({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getServiceTermsControllerGetAgreementsV1QueryKey() }),
          queryClient.invalidateQueries({ queryKey: getServiceTermsControllerGetAgreementHistoryV1QueryKey() }),
        ]);
      },
    },
  });
  return (
    <SectionCard textSize="sm" icon="file-text" title="약관 동의 현황" description="약관별 동의 상태와 내용을 확인하고 변경할 수 있습니다.">
      <SectionCard.Content className="grid gap-3">
        {agreements.map((term) => (
          <div key={term.termId} className="grid gap-2 rounded-lg border p-3">
            <ActionCard icon="file-text" iconColor={term.isAgreed ? 'text-primary' : 'text-muted-foreground'} title={term.title} description={`v${term.version}${term.isRequired ? ' · 필수' : ' · 선택'}`} variant="outline">
              <ActionCard.Actions>
                <Button type="button" size="sm" variant="ghost" onClick={() => void openModal(AgreementHistoryModal, { term })}>동의 이력</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => void openModal(OnboardingTermDetailModal, { term })}>내용 보기</Button>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <Checkbox checked={term.isAgreed} disabled={term.isRequired || mutation.isPending} onCheckedChange={(checked) => void mutation.mutateAsync({ data: { agreements: [{ termId: term.termId, isAgreed: checked === true }] } })} />
                  <span className={term.isAgreed
                    ? 'text-primary'
                    : `text-muted-foreground`}
                  >
                    {getAgreementLabel(term)}
                  </span>
                </label>
              </ActionCard.Actions>
            </ActionCard>
            {Object.keys(term.metadata?.options ?? {}).map((key) => (
              <label key={key} className="flex items-center gap-2 px-3 text-sm">
                <Checkbox
                  aria-label={`${term.title} ${receptionOptionLabel(key)}`}
                  checked={term.isAgreed && term.agreementMetadata?.options?.[key] === true}
                  disabled={mutation.isPending}
                  onCheckedChange={(checked) => {
                    const options = receptionOptions(term, key, checked === true);
                    mutation.mutate({ data: { agreements: [{ termId: term.termId, isAgreed: term.isRequired || Object.values(options).some(Boolean), metadata: { options } }] } });
                  }}
                />
                {receptionOptionLabel(key)}
                {' '}
                수신
              </label>
            ))}
          </div>
        ))}
        {agreements.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            확인할 약관이 없습니다.
          </p>
        )}
      </SectionCard.Content>
    </SectionCard>
  );
}

function getAgreementLabel(term: ServiceTermAgreementItem): string {
  if (term.isRequired) return '필수 약관';
  return term.isAgreed ? '동의함' : '동의 안 함';
}

function receptionOptions(term: ServiceTermAgreementItem, key: string, value: boolean): Record<string, boolean> {
  return Object.fromEntries(Object.keys(term.metadata?.options ?? {}).map((channel) => [channel, channel === key ? value : term.isAgreed && term.agreementMetadata?.options?.[channel] === true]));
}
