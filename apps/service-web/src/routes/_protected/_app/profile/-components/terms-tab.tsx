import { useQueryClient } from '@tanstack/react-query';

import { getServiceTermsControllerGetAgreementHistoryV1QueryKey, getServiceTermsControllerGetAgreementsV1QueryKey, useServiceTermsControllerSetAgreementsV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import type { ServiceTermAgreementItem } from '#/.generated/api/model';
import { Button, Checkbox } from '#/.generated/shadcn/components/ui';
import { ActionCard, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { receptionOptionLabel } from '#/components/terms/reception-options';
import { OnboardingTermDetailModal } from '#/routes/_protected/_global/onboarding/-components/term-detail-modal';

import { AgreementHistoryModal } from './agreement-history-modal';
import { TermRevisionHistoryModal } from './term-revision-history-modal';

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
    <SectionCard textSize="sm" icon="file-text" title="약관 동의 현황" description="약관 내용을 확인하고 선택 항목의 동의를 변경할 수 있습니다.">
      <SectionCard.Content className="grid gap-3">
        {agreements.map((term) => {
          const keys = Object.keys(term.metadata?.options ?? {});
          const selectedCount = keys.filter((key) => term.isAgreed && term.agreementMetadata?.options?.[key] === true).length;
          const hasOptions = !term.isRequired && keys.length > 0;
          return (
            <div key={term.termId} className="grid gap-2">
              <ActionCard icon="file-text" iconColor={term.isAgreed ? 'text-primary' : 'text-muted-foreground'} title={term.title} description={`v${term.version}${term.isRequired ? ' · 필수' : ' · 선택'}`} variant="outline">
                <ActionCard.Actions>
                  <Button type="button" size="sm" variant="ghost" onClick={() => void openModal(TermRevisionHistoryModal, { term })}>개정 이력</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => void openModal(AgreementHistoryModal, { term })}>동의 이력</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => void openModal(OnboardingTermDetailModal, { term })}>내용 보기</Button>
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <Checkbox
                      aria-label={`${term.title} 동의`}
                      checked={hasOptions ? selectedCount === keys.length : term.isAgreed}
                      indeterminate={hasOptions && selectedCount > 0 && selectedCount < keys.length}
                      className="
                        data-indeterminate:border-primary
                        data-indeterminate:bg-primary
                        data-indeterminate:text-primary-foreground
                        data-indeterminate:[&_svg]:hidden
                        dark:data-indeterminate:border-primary
                        dark:data-indeterminate:bg-primary
                        dark:data-indeterminate:text-primary-foreground
                        data-indeterminate:before:absolute
                        data-indeterminate:before:left-1/2
                        data-indeterminate:before:top-1/2
                        data-indeterminate:before:h-0.5
                        data-indeterminate:before:w-2
                        data-indeterminate:before:-translate-1/2
                        data-indeterminate:before:rounded-full
                        data-indeterminate:before:bg-primary-foreground
                        data-indeterminate:before:content-['']
                      "
                      disabled={term.isRequired || mutation.isPending}
                      onCheckedChange={(checked) => void mutation.mutateAsync({ data: { agreements: [{ termId: term.termId, isAgreed: checked === true, ...(hasOptions ? { metadata: { ...term.agreementMetadata, options: Object.fromEntries(keys.map((key) => [key, checked === true])) } } : {}) }] } })}
                    />
                    <span className={term.isAgreed
                      ? 'text-primary'
                      : `text-muted-foreground`}
                    >
                      동의
                    </span>
                  </label>
                </ActionCard.Actions>
              </ActionCard>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3">
                {Object.keys(term.metadata?.options ?? {}).map((key) => (
                  <label
                    key={key}
                    className="
                      flex items-center gap-2 whitespace-nowrap text-sm
                    "
                  >
                    <Checkbox
                      aria-label={`${term.title} ${(key === 'sms' ? 'SMS' : receptionOptionLabel(key))}`}
                      checked={term.isAgreed && term.agreementMetadata?.options?.[key] === true}
                      disabled={mutation.isPending}
                      onCheckedChange={(checked) => {
                        const options = receptionOptions(term, key, checked === true);
                        mutation.mutate({ data: { agreements: [{ termId: term.termId, isAgreed: term.isRequired || Object.values(options).some(Boolean), metadata: { ...term.agreementMetadata, options } }] } });
                      }}
                    />
                    {(key === 'sms' ? 'SMS' : receptionOptionLabel(key))}
                    {' '}
                    수신
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {agreements.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            표시할 약관이 없습니다.
          </p>
        )}
      </SectionCard.Content>
    </SectionCard>
  );
}

function receptionOptions(term: ServiceTermAgreementItem, key: string, value: boolean): Record<string, boolean> {
  return Object.fromEntries(Object.keys(term.metadata?.options ?? {}).map((channel) => [channel, channel === key ? value : term.isAgreed && term.agreementMetadata?.options?.[channel] === true]));
}
