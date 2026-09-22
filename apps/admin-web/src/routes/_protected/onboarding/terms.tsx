import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, Check, ChevronRight, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import { getTermsControllerGetAgreementsV1QueryKey, useTermsControllerGetAgreementsV1, useTermsControllerSetAgreementsV1 } from '#/.generated/api/endpoints/terms/terms';
import type { SetAgreementItemDto, TermAgreementItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { TermDetailModal } from '#/routes/_protected/_app/-term-detail-modal';

import { OnboardingLayout } from './-components/onboarding-layout';

type OptionValue = boolean | string | number | null;
type TermsFormValues = {
  agreeAll: boolean
  agreements: Record<string, boolean>
  options: Record<string, Record<string, OptionValue>>
};
type TermsFormApi = ReturnType<typeof useAppForm>;

type OptionControl = {
  type: 'checkbox' | 'select'
  label: string
  choices?: { value: string | number, label: string }[]
};

const optionLabels: Record<string, string> = {
  email: '이메일 수신',
  sms: '문자 수신',
  messenger: '메신저 수신',
};

const optionControls: Record<string, Record<string, OptionControl>> = {
  'marketing-agree': {
    email: { type: 'checkbox', label: '이메일 수신' },
    sms: { type: 'checkbox', label: '문자 수신' },
    messenger: { type: 'checkbox', label: '메신저 수신' },
    frequency: {
      type: 'select',
      label: '수신 빈도',
      choices: [
        { value: 'daily', label: '매일' },
        { value: 'weekly', label: '매주' },
      ],
    },
  },
};

export const Route = createFileRoute('/_protected/onboarding/terms')({ component: TermsOnboardingPage });

function TermsOnboardingPage() {
  const queryClient = useQueryClient();
  const agreementsQuery = useTermsControllerGetAgreementsV1(undefined, { query: { staleTime: 30_000 } });
  const agreementItems = agreementsQuery.data?.data.items;
  const terms = useMemo(() => (agreementItems ?? []).filter((term) => !term.isAgreed), [agreementItems]);
  const agreeMutation = useTermsControllerSetAgreementsV1();
  const defaultValues = useMemo<TermsFormValues>(() => ({
    agreeAll: false,
    agreements: Object.fromEntries(terms.map((term) => [term.id, false])),
    options: Object.fromEntries(terms.map((term) => [term.id, getOptionDefaults(term)])),
  }), [terms]);
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const payload: SetAgreementItemDto[] = terms
        .filter((term) => value.agreements[term.id] || hasSelectedOption(value.options[term.id] ?? {}))
        .map((term) => ({
          id: term.id,
          isAgreed: true,
          ...(Object.keys(value.options[term.id] ?? {}).length > 0 ? { metadata: { options: value.options[term.id] } } : {}),
        }));
      await agreeMutation.mutateAsync({ data: { agreements: payload } });
      await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAgreementsV1QueryKey() });
    },
  });

  return (
    <form.AppForm>
      <form.Subscribe selector={(state) => ({ agreements: state.values.agreements, options: state.values.options })}>
        {({ agreements: checked, options }) => {
          const allChecked = terms.length > 0 && terms.every((term) => checked[term.id] || hasSelectedOption(options[term.id] ?? {}));
          const requiredUnchecked = terms.some((term) => term.isRequired && !checked[term.id] && !hasSelectedOption(options[term.id] ?? {}));
          const toggleAll = (value: boolean) => {
            form.setFieldValue('agreements', Object.fromEntries(terms.map((term) => [term.id, value])));
            form.setFieldValue('options', Object.fromEntries(terms.map((term) => [term.id, value ? selectAllOptions(term) : getOptionDefaults(term)])));
          };
          return (
            <OnboardingLayout
              icon="shield-check"
              title="관리자 온보딩"
              description="관리자 시스템을 사용하기 전에 약관을 확인하고 동의해 주세요."
              footer={(
                <Button
                  type="submit"
                  form="terms-onboarding-form"
                  size="lg"
                  disabled={requiredUnchecked || agreeMutation.isPending}
                  className="h-11 w-full gap-2 text-sm font-bold"
                >
                  {agreeMutation.isPending
                    ? (
                      <Loader2 className="size-4 animate-spin" />
                    )
                    : (
                      <Check className="size-4" />
                    )}
                  동의하고 계속하기
                  <ArrowRight className="size-4" />
                </Button>
              )}
            >
              <FormLayout
                id="terms-onboarding-form"
                onSubmit={() => void form.handleSubmit()}
                className="grid grid-rows-[auto_minmax(0,1fr)] gap-3"
              >
                <form.AppField name="agreeAll">
                  {(field) => (
                    <field.Checkbox
                      checked={allChecked}
                      onCheckedChange={(value) => toggleAll(Boolean(value))}
                      showError={false}
                      label={<span className="text-sm font-bold">전체 약관에 동의합니다.</span>}
                      description="필수 약관에 동의해야 관리자 시스템을 사용할 수 있습니다."
                    />
                  )}
                </form.AppField>
                <div className="grid gap-2.5 scroll-y pr-1">
                  {terms.map((term) => <TermAgreementCard key={term.id} term={term} form={form as TermsFormApi} />)}
                  {terms.length === 0 && (
                    <p className="
                      py-8 text-center text-sm text-muted-foreground
                    "
                    >
                      확인할 약관이 없습니다.
                    </p>
                  )}
                </div>
              </FormLayout>
            </OnboardingLayout>
          );
        }}
      </form.Subscribe>
    </form.AppForm>
  );
}

function TermAgreementCard({ term, form }: { term: TermAgreementItemDto, form: ReturnType<typeof useAppForm> }) {
  const controls = getOptionKeys(term);
  return (
    <SectionCard variant="outline" textSize="sm">
      <SectionCard.Content className="grid gap-2 py-2">
        <div className="flex items-center justify-between gap-2">
          <form.AppField name={`agreements.${term.id}`}>
            {(field) => (
              <field.Checkbox
                showError={false}
                label={(
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{term.title}</span>
                    <span className={`
                      rounded-sm px-1.5 py-0.5 text-[10px] font-bold
                      ${term.isRequired
                    ? `bg-primary text-primary-foreground`
                    : `bg-secondary text-secondary-foreground`}
                    `}
                    >
                      {term.isRequired ? '필수' : '선택'}
                    </span>
                  </span>
                )}
              />
            )}
          </form.AppField>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 text-muted-foreground"
            aria-label={`${term.title} 내용 보기`}
            onClick={() => void openModal(TermDetailModal, { term })}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
        {controls.length > 0 && (
          <div className="
            grid gap-2 border-t pt-2
            sm:grid-cols-2
          "
          >
            {controls.map((key) => {
              const control = optionControls[term.code]?.[key] ?? { type: 'checkbox' as const, label: optionLabels[key] ?? key };
              if (control.type === 'select') {
                return <form.AppField key={key} name={`options.${term.id}.${key}`}>{(field) => <field.Select label={control.label} options={(control.choices ?? []).map((choice) => ({ ...choice, value: String(choice.value) }))} />}</form.AppField>;
              }
              return <form.AppField key={key} name={`options.${term.id}.${key}`}>{(field) => <field.Checkbox label={control.label} checked={Boolean(field.state.value)} showError={false} />}</form.AppField>;
            })}
          </div>
        )}
      </SectionCard.Content>
    </SectionCard>
  );
}

function hasSelectedOption(options: Record<string, OptionValue>): boolean {
  return Object.values(options).some((value) => value === true || (typeof value === 'string' && value.length > 0) || typeof value === 'number');
}

function getOptionKeys(term: TermAgreementItemDto): string[] {
  return [...new Set([
    ...Object.keys(optionControls[term.code] ?? {}),
    ...Object.keys(term.metadata?.options ?? {}),
  ])];
}

function getOptionDefaults(term: TermAgreementItemDto): Record<string, OptionValue> {
  const existing = term.metadata?.options ?? {};
  return Object.fromEntries(getOptionKeys(term).map((key) => [key, existing[key] ?? null]));
}

function selectAllOptions(term: TermAgreementItemDto): Record<string, OptionValue> {
  return Object.fromEntries(getOptionKeys(term).map((key) => {
    const control = optionControls[term.code]?.[key];
    return [key, control?.type === 'checkbox' ? true : control?.choices?.[0]?.value ?? null];
  }));
}
