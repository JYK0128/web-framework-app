import { useQueryClient } from '@tanstack/react-query';

import { getTermsControllerGetAgreementsV1QueryKey, useTermsControllerGetAgreementsV1, useTermsControllerSetAgreementsV1 } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementOptionPrimitive, SetAgreementItemDto, TermAgreementItemDto } from '#/.generated/api/model';
import { Button, Checkbox } from '#/.generated/shadcn/components/ui';
import { ActionCard, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';

import { TermDetailModal } from './term-detail-modal';

type AgreementOption = 'email' | 'sms' | 'messenger';

type OptionChoice = {
  value: string | number
  label: string
};

type OptionControl = {
  type: 'checkbox' | 'radio'
  label: string
  choices?: OptionChoice[]
};

type OptionMap = Record<string, AgreementOptionPrimitive>;

const optionLabels: Record<AgreementOption, string> = {
  email: '이메일',
  sms: '문자',
  messenger: '메신저',
};

const optionControls: Record<string, Record<string, OptionControl>> = {
  'marketing-agree': {
    frequency: {
      type: 'radio',
      label: '수신 빈도',
      choices: [
        { value: 'daily', label: '매일' },
        { value: 'weekly', label: '매주' },
      ],
    },
  },
};

export function ProfileTermsTab({ agreements }: { agreements: TermAgreementItemDto[] }) {
  const queryClient = useQueryClient();
  const agreementsQuery = useTermsControllerGetAgreementsV1();
  const currentAgreements = agreementsQuery.data?.data.items ?? agreements;
  const setAgreementsMutation = useTermsControllerSetAgreementsV1({
    mutation: {
      meta: { successMessage: '약관 동의 상태가 변경되었습니다.' },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getTermsControllerGetAgreementsV1QueryKey(),
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
        description="약관별 동의 상태와 내용을 확인하고 변경할 수 있습니다."
      >
        <SectionCard.Content className="grid gap-3">
          {currentAgreements.map((term) => {
            let agreementLabel = '동의 안 함';
            if (term.isRequired) agreementLabel = '필수 약관';
            else if (term.isAgreed) agreementLabel = '동의함';

            return (
              <ActionCard
                key={term.id}
                icon="file-text"
                iconColor={term.isAgreed ? 'text-primary' : 'text-muted-foreground'}
                title={term.title}
                description={`${term.code} · v${term.version}${term.isRequired ? ' · 필수' : ' · 선택'}`}
                variant="outline"
              >
                <ActionCard.Actions>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void openModal(TermDetailModal, { term }, { modalId: `term-detail-${term.id}` })}
                  >
                    내용 보기
                  </Button>
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <Checkbox
                      checked={term.isAgreed}
                      disabled={term.isRequired || setAgreementsMutation.isPending}
                      onCheckedChange={(checked) => {
                        void updateAgreement({ id: term.id, isAgreed: checked === true });
                      }}
                    />
                    <span className={term.isAgreed
                      ? 'text-primary'
                      : `text-muted-foreground`}
                    >
                      {agreementLabel}
                    </span>
                  </label>
                </ActionCard.Actions>
              </ActionCard>
            );
          })}
          {currentAgreements.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              확인할 약관이 없습니다.
            </p>
          )}
        </SectionCard.Content>
      </SectionCard>

      {currentAgreements
        .filter((term) => term.metadata?.options)
        .map((term) => (
          <TermOptionsCard
            key={`${term.id}-options`}
            term={term}
            disabled={setAgreementsMutation.isPending}
            onChange={(metadata) => {
              void updateAgreement({
                id: term.id,
                isAgreed: hasSelectedOption(metadata.options ?? {}),
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
  const options = term.metadata?.options ?? {};

  return (
    <SectionCard
      textSize="sm"
      icon="settings"
      title={`${term.title} 옵션`}
      description="약관과 함께 저장되는 선택 옵션을 설정합니다."
    >
      <SectionCard.Content className="
        grid gap-3
        sm:grid-cols-3
      "
      >
        {Object.entries(options).map(([option, value]) => {
          const control = optionControls[term.code]?.[option] ?? {
            type: 'checkbox',
            label: optionLabels[option as AgreementOption] ?? option,
          } satisfies OptionControl;

          if (control.type === 'radio') {
            return (
              <fieldset
                key={option}
                className="grid gap-2 rounded-md border p-3 text-sm"
              >
                <span className="font-medium">{control.label}</span>
                <div className="grid gap-2">
                  {control.choices?.map((choice) => (
                    <label
                      key={String(choice.value)}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="radio"
                        name={`term-option-${term.id}-${option}`}
                        value={String(choice.value)}
                        checked={toOptionKey(value) === toOptionKey(choice.value)}
                        disabled={disabled}
                        onChange={() => onChange({
                          options: updateOptionValue(options, option, choice.value),
                        })}
                      />
                      {choice.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          }

          return (
            <label
              key={option}
              className="flex items-center gap-2 rounded-md border p-3 text-sm"
            >
              <Checkbox
                checked={value === true}
                disabled={disabled}
                onCheckedChange={(checked) => onChange({
                  options: updateOptionValue(options, option, checked === true),
                })}
              />
              {control.label}
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

function toOptionKey(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
