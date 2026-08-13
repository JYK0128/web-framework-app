import { useI18n } from '@pkg/shared/web';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Check, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { getTermsControllerGetAgreementsQueryOptions, useTermsControllerSetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto, TermAgreementItemDto } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, Checkbox } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';

export const Route = createFileRoute('/_protected/onboarding/term')({
  beforeLoad: async ({ context }) => {
    const response = await context.queryClient.fetchQuery(
      getTermsControllerGetAgreementsQueryOptions(),
    );
    const agreements = response?.terms ?? [];
    const hasRequiredTerms = agreements.some(
      (term) => term.isRequired && !term.isAgreed,
    );

    if (!hasRequiredTerms) throw redirect({ to: '/profile' });

    return { agreements };
  },
  component: TermsOnboardingPage,
});

function TermsOnboardingPage() {
  const { agreements } = Route.useRouteContext();
  const { t } = useI18n();

  return (
    <div className="grid h-full place-items-center scroll-y p-4">
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
            <h1 className="text-2xl font-bold tracking-tight">{t('onboarding.termsTitle')}</h1>
            <p className="text-xs text-muted-foreground">
              {t('onboarding.termsDescription')}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-6">
            <TermsAgreementForm agreements={agreements} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TermsAgreementForm({ agreements }: { agreements: AgreementDto[] }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const terms = agreements.filter((term) => !term.isAgreed);

  const agreeTermsMutation = useTermsControllerSetAgreements();

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
        toast.error(t('onboarding.requiredTermsError'));
        return;
      }

      const payload: TermAgreementItemDto[] = terms
        .filter((term) => value.agreements[term.id])
        .map((term) => ({
          id: term.id,
          isAgreed: true,
        }));

      await agreeTermsMutation.mutateAsync({ data: { agreements: payload } });
      await navigate({ to: '/profile', replace: true });
    },
  });

  return (
    <termsForm.AppForm>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void termsForm.handleSubmit();
        }}
        className="grid gap-4"
      >
        <div className="grid max-h-80 gap-3 scroll-y pr-1">
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
                  <div className="grid min-w-0 flex-1 gap-1.5">
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
                        {term.isRequired ? t('onboarding.required') : t('onboarding.optional')}
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
              <span>{isSubmitting ? t('onboarding.accepting') : t('onboarding.acceptAndStart')}</span>
              <Check className="ml-1 size-4 shrink-0" />
            </Button>
          )}
        </termsForm.Subscribe>
      </form>
    </termsForm.AppForm>
  );
}
