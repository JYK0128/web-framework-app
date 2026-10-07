import { useQueryClient } from '@tanstack/react-query';

import { getOperatorTermsControllerGetAgreementsV1QueryKey, useOperatorTermsControllerSetOperatorAgreementsV1 } from '#/.generated/api/endpoints/operator-terms/operator-terms';
import type { SetAgreementItemDto, TermAgreementItemDto } from '#/.generated/api/model';
import { Button, Checkbox } from '#/.generated/shadcn/components/ui';
import { ActionCard, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';

import { AgreementHistoryModal } from './agreement-history-modal';
import { ProfileTermDetailModal } from './term-detail-modal';
import { TermRevisionHistoryModal } from './term-revision-history-modal';

type AgreementOption = 'email' | 'sms' | 'messenger';

type OptionMap = Record<string, string | number | boolean | null>;

type AgreementOptionPrimitive = boolean | string | number | null;

const optionLabels: Record<AgreementOption, string> = {
  email: '이메일 수신',
  sms: 'SMS 수신',
  messenger: '메신저 수신',
};

export function ProfileTermsTab({ agreements }: { agreements: TermAgreementItemDto[] }) {
  const queryClient = useQueryClient();
  const setAgreementsMutation = useOperatorTermsControllerSetOperatorAgreementsV1({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getOperatorTermsControllerGetAgreementsV1QueryKey(),
        });
      },
    },
  });

  const updateAgreement = async (input: SetAgreementItemDto) => {
    await setAgreementsMutation.mutateAsync({
      data: { agreements: [input] },
    });
  };

  return (
    <div className="grid gap-6">
      <SectionCard
        textSize="sm"
        icon="file-text"
        title="약관 동의 현황"
        description="약관 내용을 확인하고 선택 항목의 동의를 변경할 수 있습니다."
      >
        <SectionCard.Content className="grid gap-3">
          {agreements.map((term) => {
            const keys = Object.keys(term.metadata?.options ?? {});
            const selectedCount = keys.filter((key) => term.isAgreed && term.agreementMetadata?.options?.[key] === true).length;
            const hasOptions = !term.isRequired && keys.length > 0;
            return (
              <ActionCard
                key={term.id}
                icon="file-text"
                iconColor={term.isAgreed ? 'text-primary' : 'text-muted-foreground'}
                title={term.title}
                description={`v${term.version}${term.isRequired ? ' · 필수' : ' · 선택'}`}
                variant="outline"
              >
                <ActionCard.Actions>
                  <Button type="button" size="sm" variant="ghost" onClick={() => void openModal(TermRevisionHistoryModal, { term })}>개정 이력</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void openModal(ProfileTermDetailModal, { term })}
                  >
                    내용 보기
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void openModal(AgreementHistoryModal, { term })}
                  >
                    동의 이력
                  </Button>
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
                      disabled={term.isRequired || setAgreementsMutation.isPending}
                      onCheckedChange={(checked) => {
                        void updateAgreement({
                          id: term.id,
                          isAgreed: checked === true,
                          ...(hasOptions ? { metadata: { ...term.agreementMetadata, options: Object.fromEntries(keys.map((key) => [key, checked === true])) } } : {}),
                        });
                      }}
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
            );
          })}
          {agreements.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              표시할 약관이 없습니다.
            </p>
          )}
        </SectionCard.Content>
      </SectionCard>

      {agreements
        .filter((term) => term.metadata?.options)
        .map((term) => (
          <TermOptionsCard
            key={`${term.id}-options`}
            term={term}
            disabled={setAgreementsMutation.isPending}
            onChange={(metadata) => {
              void updateAgreement({
                id: term.id,
                isAgreed: term.isRequired || hasSelectedOption((metadata.options ?? {})),
                metadata,
              });
            }}
          />
        ))}

    </div>
  );
}

function TermOptionsCard({
  term,
  disabled,
  onChange,
}: {
  term: TermAgreementItemDto
  disabled: boolean
  onChange: (metadata: NonNullable<SetAgreementItemDto['metadata']>) => void
}) {
  const optionDefinitions = term.metadata?.options ?? {};
  const options = term.agreementMetadata?.options ?? {};

  return (
    <SectionCard
      textSize="sm"
      icon="settings"
      title={`${term.title} 옵션`}
      description="약관과 함께 저장되는 선택 옵션을 설정합니다."
    >
      <SectionCard.Content className="flex flex-wrap items-center gap-3">
        {Object.keys(optionDefinitions).map((option) => {
          const value = options[option];
          return (
            <label
              key={option}
              className="
                flex items-center gap-2 whitespace-nowrap rounded-md border p-3
                text-sm
              "
            >
              <Checkbox
                checked={term.isAgreed && value === true}
                disabled={disabled}
                onCheckedChange={(checked) => onChange({
                  ...term.agreementMetadata,
                  options: updateOptionValue(Object.fromEntries(Object.keys(optionDefinitions).map((key) => [key, term.isAgreed && options[key] === true])), option, checked === true),
                })}
              />
              {optionLabels[option as AgreementOption] ?? option}
            </label>
          );
        })}
      </SectionCard.Content>
    </SectionCard>
  );
}

function updateOptionValue(options: OptionMap, key: string, value: AgreementOptionPrimitive): OptionMap {
  return { ...options, [key]: value };
}

function hasSelectedOption(options: OptionMap): boolean {
  return Object.values(options).some((value) => {
    return value === true || (typeof value === 'string' && value.length > 0) || typeof value === 'number';
  });
}
