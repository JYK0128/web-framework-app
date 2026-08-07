import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Check, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { getAuthControllerUserProfileQueryKey } from '#/.generated/api/endpoints/auth/auth';
import { getTermsControllerGetAgreementsQueryKey, getTermsControllerGetAgreementsQueryOptions, useTermsControllerGetAgreements, useTermsControllerSetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { TermAgreementItemDto } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, Checkbox, Spinner } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';

export const Route = createFileRoute('/_protected/onboarding/term')({
  beforeLoad: async ({ context }) => {
    const response = await context.queryClient.fetchQuery(
      getTermsControllerGetAgreementsQueryOptions(),
    );
    const agreements = response.data?.terms ?? [];
    const hasRequiredTerms = agreements.some(
      (term) => term.isRequired && !term.isAgreed,
    );

    if (!hasRequiredTerms) throw redirect({ to: '/dashboard' });
  },
  component: TermsOnboardingPage,
});

function TermsOnboardingPage() {
  const { isLoading: isTermsLoading } = useTermsControllerGetAgreements();

  if (isTermsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="grid justify-items-center gap-3">
          <Spinner className="size-8 text-orange-500" />
          <p className="text-xs font-semibold text-muted-foreground">
            불러오는 중입니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-md gap-6">
        <div className="grid justify-items-center gap-2 text-center">
          <div className="
            flex size-12 items-center justify-center rounded-2xl bg-primary
            text-primary-foreground shadow-md
          "
          >
            <ShieldCheck className="size-6 shrink-0" />
          </div>
          <div className="grid gap-1">
            <h1 className="text-2xl font-bold tracking-tight">서비스 약관 동의</h1>
            <p className="text-xs text-muted-foreground">
              서비스 이용을 위해 아래 필수 약관에 동의해주세요.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-6">
            <TermsAgreementForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TermsAgreementForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: agreementsResponse, isLoading } = useTermsControllerGetAgreements();
  const allTerms = agreementsResponse?.data?.terms ?? [];
  const terms = allTerms.filter((term) => !term.isAgreed);

  const agreeTermsMutation = useTermsControllerSetAgreements({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getTermsControllerGetAgreementsQueryKey() }),
        ]);
      },
    },
  });

  const initialAgreements = terms.reduce<Record<string, boolean>>((acc, term) => {
    acc[term.id] = false;
    return acc;
  }, {});

  const termsForm = useAppForm({
    defaultValues: {
      agreements: initialAgreements,
    },
    onSubmit: async ({ value }) => {
      const missingRequired = terms.some(
        (term) => term.isRequired && !value.agreements[term.id],
      );
      if (missingRequired) {
        toast.error('필수 약관에 동의해야 서비스를 이용하실 수 있습니다.');
        return;
      }

      const payload: TermAgreementItemDto[] = terms
        .filter((term) => value.agreements[term.id])
        .map((term) => ({
          id: term.id,
          isAgreed: true,
        }));

      await agreeTermsMutation.mutateAsync({ data: { agreements: payload } });
      await navigate({ to: '/dashboard', replace: true });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6 text-orange-500" />
      </div>
    );
  }

  return (
    <termsForm.AppForm>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void termsForm.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
          {terms.map((term) => (
            <termsForm.AppField key={term.id} name={`agreements.${term.id}`}>
              {(field) => (
                <div className="
                  flex items-start gap-3 rounded-xl border border-zinc-200/80
                  bg-zinc-50/50 p-4 transition-colors
                  hover:bg-zinc-100/50
                  dark:border-zinc-800/80 dark:bg-zinc-900/50
                  dark:hover:bg-zinc-900
                "
                >
                  <Checkbox
                    id={`term-${term.id}`}
                    checked={Boolean(field.state.value)}
                    onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`term-${term.id}`}
                        className="
                          cursor-pointer select-none font-semibold text-xs/snug
                          text-zinc-900
                          dark:text-zinc-100
                        "
                      >
                        {term.title}
                      </label>
                      <Badge
                        variant={term.isRequired ? 'default' : 'secondary'}
                        className="shrink-0 px-2 py-0.5 text-[10px] font-bold"
                      >
                        {term.isRequired ? '필수' : '선택'}
                      </Badge>
                    </div>
                    {term.content && (
                      <p className="
                        line-clamp-3 text-xs/relaxed text-zinc-500
                        dark:text-zinc-400
                      "
                      >
                        {term.content}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </termsForm.AppField>
          ))}
        </div>

        <termsForm.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full text-sm font-bold"
            >
              <span>{isSubmitting ? '동의 처리 중...' : '약관 동의 완료 및 시작하기'}</span>
              <Check className="ml-1 size-4 shrink-0" />
            </Button>
          )}
        </termsForm.Subscribe>
      </form>
    </termsForm.AppForm>
  );
}
