import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';

import { getServiceTermsControllerGetAgreementsV1QueryKey, useServiceTermsControllerGetAgreementsV1, useServiceTermsControllerGetTermsV1, useServiceTermsControllerSetAgreementsV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import type { ServiceTermItem, SetServiceTermAgreementsRequest } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { PageSection, SectionCard } from '#/components/layout';

export const Route = createFileRoute('/_protected/app/service-terms')({ component: ServiceTermsPage });

function AgreementForm({ terms, agreed }: { terms: ServiceTermItem[], agreed: Record<string, boolean> }) {
  const queryClient = useQueryClient();
  const mutation = useServiceTermsControllerSetAgreementsV1({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getServiceTermsControllerGetAgreementsV1QueryKey() }),
    },
  });
  const defaults = useMemo(
    () => ({ agreements: Object.fromEntries(terms.map((term) => [term.id, agreed[term.id] === true])) }),
    [terms, agreed],
  );
  const form = useAppForm({
    defaultValues: defaults,
    onSubmit: async ({ value }) => {
      const data: SetServiceTermAgreementsRequest = {
        agreements: Object.entries(value.agreements).map(([termId, isAgreed]) => ({ termId, isAgreed })),
      };
      mutation.mutate({ data });
    },
  });
  return (
    <form.AppForm>
      <form.Subscribe selector={(state) => state.values.agreements}>
        {(values) => (
          <FormLayout
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <div className="grid gap-3">
              {terms.map((term) => (
                <form.AppField key={term.id} name={`agreements.${term.id}`}>
                  {(field) => (
                    <field.Checkbox
                      label={(
                        <span>
                          {term.title}
                          {term.isRequired && (
                            <span className="ml-1 text-xs text-destructive">
                              (필수)
                            </span>
                          )}
                        </span>
                      )}
                      description={`버전 ${term.version}`}
                      showError={false}
                    />
                  )}
                </form.AppField>
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending || Object.keys(values).length === 0}>
                {mutation.isPending ? '저장 중...' : '동의 상태 저장'}
              </Button>
            </div>
          </FormLayout>
        )}
      </form.Subscribe>
    </form.AppForm>
  );
}

function ServiceTermsPage() {
  const termsQuery = useServiceTermsControllerGetTermsV1({ page: 1, limit: 100 });
  const agreementsQuery = useServiceTermsControllerGetAgreementsV1();
  const terms = termsQuery.data?.data.items ?? [];
  const agreed = Object.fromEntries((agreementsQuery.data?.data.items ?? []).map((item) => [item.termId, item.isAgreed]));
  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="file-text" title="서비스 약관" description="관리자 약관과 구분된 고객용 서비스 약관입니다.">
        <PageSection.Content className="
          mx-auto grid w-full max-w-4xl gap-4 pt-2
        "
        >
          {(termsQuery.isLoading || agreementsQuery.isLoading) && (
            <Skeleton className="h-32 w-full" />
          )}
          {(termsQuery.isError || agreementsQuery.isError) && (
            <SectionCard variant="destructive">
              <SectionCard.Content className="p-6 text-destructive">
                서비스 약관을 불러오지 못했습니다.
              </SectionCard.Content>
            </SectionCard>
          )}
          {!termsQuery.isLoading && !termsQuery.isError && terms.length === 0 && (
            <SectionCard variant="secondary">
              <SectionCard.Content className="p-6 text-muted-foreground">
                현재 게시된 서비스 약관이 없습니다.
              </SectionCard.Content>
            </SectionCard>
          )}
          {terms.length > 0 && (
            <SectionCard textSize="sm" title="약관 동의 상태">
              <SectionCard.Content className="p-4">
                <AgreementForm key={terms.map((term) => term.id).join(',')} terms={terms} agreed={agreed} />
              </SectionCard.Content>
            </SectionCard>
          )}
          {terms.map((term) => (
            <SectionCard key={term.id} textSize="sm" title={term.title} description={`버전 v${term.version}`}>
              <SectionCard.Content className="whitespace-pre-wrap p-4 text-sm/6">
                {term.content}
              </SectionCard.Content>
            </SectionCard>
          ))}
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
