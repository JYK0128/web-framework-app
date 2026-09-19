import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { getTermsControllerGetAgreementsV1QueryKey, useTermsControllerGetAgreementsV1, useTermsControllerSetAgreementsV1 } from '#/.generated/api/endpoints/terms/terms';
import type { SetAgreementItemDto, TermAgreementItemDto } from '#/.generated/api/model';
import { Button, Checkbox } from '#/.generated/shadcn/components/ui';
import { ActionCard, SectionCard } from '#/components/layout';

type AgreementOption = 'email' | 'sms' | 'messenger';

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
          {currentAgreements.map((term) => (
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
                  {term.isAgreed ? '동의함' : '동의 안 함'}
                </label>
              </ActionCard.Actions>
            </ActionCard>
          ))}
          {agreements.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              확인할 약관이 없습니다.
            </p>
          )}
        </SectionCard.Content>
      </SectionCard>

      {currentAgreements.some((term) => term.code === 'marketing-agree') && (
        <MarketingOptionsCard
          term={currentAgreements.find((item) => item.code === 'marketing-agree')!}
          disabled={setAgreementsMutation.isPending}
          onChange={(metadata) => {
            const term = currentAgreements.find((item) => item.code === 'marketing-agree');
            if (!term) return;
            void updateAgreement({
              id: term.id,
              isAgreed: Object.values(metadata.options ?? {}).some(Boolean),
              metadata,
            });
          }}
        />
      )}

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

function MarketingOptionsCard({
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
      icon="megaphone"
      title="마케팅 수신 채널"
      description="마케팅 정보 수신 채널을 개별적으로 설정합니다."
    >
      <SectionCard.Content className="
        grid gap-3
        sm:grid-cols-3
      "
      >
        {(Object.keys(optionLabels) as AgreementOption[]).map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 rounded-md border p-3 text-sm"
          >
            <Checkbox
              checked={options[option] === true}
              disabled={disabled}
              onCheckedChange={(checked) => onChange({
                options: { ...options, [option]: checked === true },
              })}
            />
            {optionLabels[option]}
          </label>
        ))}
      </SectionCard.Content>
    </SectionCard>
  );
}
