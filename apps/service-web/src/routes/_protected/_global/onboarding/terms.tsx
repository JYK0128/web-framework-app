import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ArrowRight, Check, ChevronRight, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import { getServiceTermsControllerGetAgreementsV1QueryKey, useServiceTermsControllerGetAgreementsV1, useServiceTermsControllerSetAgreementsV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import type { ServiceTermAgreementItem } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { receptionOptionLabel } from '#/components/terms/reception-options';

import { OnboardingLayout } from './-components/onboarding-layout';
import { OnboardingTermDetailModal } from './-components/term-detail-modal';

export const Route = createFileRoute('/_protected/_global/onboarding/terms')({
  validateSearch: z.object({ callback: z.string().optional() }),
  component: TermsOnboardingPage,
});

function TermsOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const agreementsQuery = useServiceTermsControllerGetAgreementsV1();
  const agreementItems = agreementsQuery.data?.items;
  const terms = useMemo(() => (agreementItems ?? []).filter((term) => !term.isAgreed), [agreementItems]);
  const agreeMutation = useServiceTermsControllerSetAgreementsV1();
  const defaultValues = useMemo(() => ({
    agreeAll: false,
    options: Object.fromEntries(terms.map((term) => [term.termId, Object.fromEntries(Object.keys(term.metadata?.options ?? {}).map((key) => [key, false]))])),
    agreements: Object.fromEntries(terms.map((term) => [term.termId, false])),
  }), [terms]);
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (terms.some((term) => term.isRequired && !value.agreements[term.termId])) return;
      await agreeMutation.mutateAsync({
        data: { agreements: terms.filter((term) => value.agreements[term.termId]).map(({ termId }) => ({ termId, isAgreed: true, metadata: { options: value.options[termId] } })) },
      });
      await queryClient.invalidateQueries({ queryKey: getServiceTermsControllerGetAgreementsV1QueryKey() });
      await router.invalidate();
    },
  });

  const renderOption = (term: ServiceTermAgreementItem, key: string) => (
    <form.AppField key={key} name="options">
      {(field) => (
        <field.Checkbox
          label={`${receptionOptionLabel(key)} 수신`}
          checked={field.state.value[term.termId]?.[key] === true}
          showError={false}
          onCheckedChange={(value) => {
            field.handleChange({ ...field.state.value, [term.termId]: { ...field.state.value[term.termId], [key]: value === true } });
            if (value === true) form.setFieldValue(`agreements.${term.termId}`, true);
          }}
        />
      )}
    </form.AppField>
  );

  const toggleAll = (value: boolean) => {
    form.setFieldValue('options', Object.fromEntries(terms.map((term) => [term.termId, Object.fromEntries(Object.keys(term.metadata?.options ?? {}).map((key) => [key, value]))])));
    form.setFieldValue('agreements', Object.fromEntries(terms.map((term) => [term.termId, value])));
  };

  return (
    <form.AppForm>
      <form.Subscribe selector={(state) => state.values.agreements}>
        {(checked) => {
          const allChecked = terms.length > 0 && terms.every((term) => checked[term.termId]);
          const requiredUnchecked = terms.some((term) => term.isRequired && !checked[term.termId]);
          return (
            <OnboardingLayout
              icon="shield-check"
              title="서비스 온보딩"
              description="서비스를 사용하기 전에 약관을 확인하고 동의해 주세요."
              footer={(
                <FormSubmit
                  form="terms-onboarding-form"
                  size="lg"
                  disabled={requiredUnchecked || agreementsQuery.isPending || agreementsQuery.isError || agreeMutation.isPending}
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
                </FormSubmit>
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
                      description="필수 약관에 동의해야 서비스를 사용할 수 있습니다."
                    />
                  )}
                </form.AppField>
                <div className="grid gap-2.5 scroll-y pr-1">
                  {agreementsQuery.isPending && (
                    <Skeleton className="h-24 w-full" />
                  )}
                  {agreementsQuery.isError && <Button type="button" variant="outline" onClick={() => void agreementsQuery.refetch()}>약관 다시 불러오기</Button>}
                  {terms.map((term) => (
                    <SectionCard key={term.termId} variant="outline" textSize="sm">
                      <SectionCard.Content className="grid gap-2 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <form.AppField name={`agreements.${term.termId}`}>
                            {(field) => (
                              <field.Checkbox
                                showError={false}
                                label={(
                                  <span className="flex items-center gap-2">
                                    <span className="text-xs font-semibold">{term.title}</span>
                                    <span className={`
                                      rounded-sm px-1.5 py-0.5 text-[10px]
                                      font-bold
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
                            onClick={() => void openModal(OnboardingTermDetailModal, { term })}
                          >
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                        {Object.keys(term.metadata?.options ?? {}).map((key) => renderOption(term, key))}
                      </SectionCard.Content>
                    </SectionCard>
                  ))}
                  {!agreementsQuery.isPending && !agreementsQuery.isError && terms.length === 0 && (
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
