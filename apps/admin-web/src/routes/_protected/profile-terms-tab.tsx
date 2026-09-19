import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { getTermsControllerGetAgreementsV1QueryKey, useTermsControllerGetAgreementsV1, useTermsControllerSetAgreementsV1 } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementOptionPrimitive, AgreementOptionValue, SetAgreementItemDto, TermAgreementItemDto } from '#/.generated/api/model';
import { Button, Checkbox } from '#/.generated/shadcn/components/ui';
import { ActionCard, SectionCard } from '#/components/layout';

type AgreementOption = 'email' | 'sms' | 'messenger';

type SelectChoice = {
  value: string | number
  label: string
};

type StructuredOption = {
  type?: 'checkbox' | 'radio'
  label?: string
  value?: boolean | string | number | null
  choices?: SelectChoice[]
};

type OptionMap = Record<string, AgreementOptionValue>;

const optionLabels: Record<AgreementOption, string> = {
  email: '이메일',
  sms: '문자',
  messenger: '메신저',
};

export function ProfileTermsTab({ agreements }: { agreements: TermAgreementItemDto[] }) {
  const queryClient = useQueryClient();
  const [selectedTerm, setSelectedTerm] = useState<TermAgreementItemDto | null>(null);
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
    setSelectedTerm(null);
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
                    onClick={() => setSelectedTerm(term)}
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

      {selectedTerm && (
        <SectionCard icon="file-text" title={selectedTerm.title} description={`v${selectedTerm.version} · ${selectedTerm.code}`}>
          <SectionCard.Content className="grid gap-3">
            <div className="
              max-h-80 scroll-y whitespace-pre-wrap rounded-md border
              bg-muted/20 p-4 text-sm/6
            "
            >
              {selectedTerm.content}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedTerm(null)}>
                닫기
              </Button>
            </div>
          </SectionCard.Content>
        </SectionCard>
      )}
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
        {Object.entries(options).map(([option, rawValue]) => {
          const structured = isStructuredOption(rawValue) ? rawValue : null;
          const label = structured?.label ?? optionLabels[option as AgreementOption] ?? option;
          const value = structured?.value ?? rawValue;

          if (structured?.type === 'radio' || structured?.choices) {
            return (
              <fieldset
                key={option}
                className="grid gap-2 rounded-md border p-3 text-sm"
              >
                <span className="font-medium">{label}</span>
                <div className="grid gap-2">
                  {structured?.choices?.map((choice) => (
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
              {label}
            </label>
          );
        })}
      </SectionCard.Content>
    </SectionCard>
  );
}

function isStructuredOption(value: AgreementOptionValue): value is StructuredOption {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function updateOptionValue(options: OptionMap, key: string, value: AgreementOptionPrimitive): OptionMap {
  const current = options[key];
  if (!isStructuredOption(current)) return { ...options, [key]: value };
  return { ...options, [key]: { ...current, value } };
}

function hasSelectedOption(options: OptionMap): boolean {
  return Object.values(options).some((value) => {
    const selectedValue = isStructuredOption(value) ? value.value : value;
    return selectedValue === true || (typeof selectedValue === 'string' && selectedValue.length > 0) || typeof selectedValue === 'number';
  });
}

function toOptionKey(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
