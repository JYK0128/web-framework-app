import { PAGINATION_MAX_LIMIT, z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { getServiceTermsControllerGetAgreementsV1QueryKey, useServiceTermsControllerGetAgreementsV1, useServiceTermsControllerGetTermsV1, useServiceTermsControllerSetAgreementsV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_protected/_global/onboarding/terms')({
  validateSearch: z.object({ callback: z.string().optional() }),
  component: TermsOnboardingPage,
});

function TermsOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const agreementsQuery = useServiceTermsControllerGetAgreementsV1();
  const termsQuery = useServiceTermsControllerGetTermsV1({ page: 1, limit: PAGINATION_MAX_LIMIT });
  const saveAgreements = useServiceTermsControllerSetAgreementsV1();
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string>();
  const termsById = useMemo(() => new Map((termsQuery.data?.items ?? []).map((term) => [term.id, term])), [termsQuery.data]);
  const required = (agreementsQuery.data?.items ?? []).filter((agreement) => agreement.isRequired && !agreement.isAgreed);
  const allAccepted = required.length > 0 && required.every((agreement) => accepted[agreement.termId]);

  async function submit() {
    if (!allAccepted) return;
    setErrorMessage(undefined);
    try {
      await saveAgreements.mutateAsync({ data: { agreements: required.map(({ termId }) => ({ termId, isAgreed: true })) } });
      await queryClient.invalidateQueries({ queryKey: getServiceTermsControllerGetAgreementsV1QueryKey() });
      await router.invalidate();
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '약관 동의를 저장하지 못했습니다.');
    }
  }

  const isLoading = agreementsQuery.isLoading || termsQuery.isLoading;
  const isError = agreementsQuery.isError || termsQuery.isError;

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-2xl border border-border/40 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">필수 약관 동의</CardTitle>
            <CardDescription>서비스를 계속 이용하려면 아래 필수 약관을 확인하고 동의해 주세요.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {isLoading && <Skeleton className="h-40 w-full" />}
            {isError && (
              <div className="grid gap-3" role="alert">
                <p className="text-sm text-destructive">약관을 불러오지 못했습니다.</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void agreementsQuery.refetch();
                    void termsQuery.refetch();
                  }}
                >
                  다시 불러오기
                </Button>
              </div>
            )}
            {!isLoading && !isError && required.map((agreement) => {
              const term = termsById.get(agreement.termId);
              return (
                <section
                  key={agreement.termId}
                  className="grid gap-3 rounded-lg border p-4"
                >
                  <div>
                    <h2 className="font-semibold">{agreement.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      버전 v
                      {agreement.version}
                      {' '}
                      · 필수
                    </p>
                  </div>
                  <div className="
                    max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md
                    bg-muted/40 p-3 text-sm/6
                  "
                  >
                    {term?.content ?? '약관 내용을 불러오지 못했습니다.'}
                  </div>
                  <label className="
                    flex cursor-pointer items-center gap-3 text-sm
                  "
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(accepted[agreement.termId])}
                      onChange={(event) => setAccepted((current) => ({ ...current, [agreement.termId]: event.target.checked }))}
                    />
                    {agreement.title}
                    에 동의합니다. (필수)
                  </label>
                </section>
              );
            })}
            {errorMessage && (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {errorMessage}
              </p>
            )}
            <Button className="w-full" disabled={!allAccepted || isLoading || isError || saveAgreements.isPending} onClick={() => void submit()}>
              {saveAgreements.isPending ? '저장 중...' : '동의하고 계속하기'}
            </Button>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
