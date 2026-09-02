import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Check, ChevronRight, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { getTermsControllerGetAgreementsQueryKey, useTermsControllerSetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto, TermAgreementItemDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { SectionCard } from '#/components/app';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

import { OnboardingLayout } from './-components/onboarding-layout';
import { TermDetailDialog } from './-components/term-detail-dialog';

export const Route = createFileRoute('/_protected/onboarding/term')({
  component: TermsOnboardingPage,
});

function TermsOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { agreements } = Route.useRouteContext();
  const { t } = useI18n();
  const terms = useMemo(
    () => agreements.terms.filter((term) => !term.isAgreed),
    [agreements.terms],
  );

  const agreeTermsMutation = useTermsControllerSetAgreements();
  const isSubmitting = agreeTermsMutation.isPending;

  // Track active term for detail modal view
  const [selectedTerm, setSelectedTerm] = useState<AgreementDto | null>(null);

  const initialValues = useMemo(() => {
    return terms.reduce<Record<string, boolean>>((acc, term) => {
      acc[term.id] = false;
      return acc;
    }, {});
  }, [terms]);

  const form = useAppForm({
    defaultValues: {
      agreeAll: false,
      agreements: initialValues,
    },
    onSubmit: async ({ value }) => {
      const payload: TermAgreementItemDto[] = terms
        .filter((term) => value.agreements[term.id])
        .map((term) => ({
          id: term.id,
          isAgreed: true,
        }));

      await agreeTermsMutation.mutateAsync({ data: { agreements: payload } });
      await queryClient.invalidateQueries({
        queryKey: getTermsControllerGetAgreementsQueryKey(),
      });
      await navigate({ to: '/dashboard', replace: true });
    },
  });

  return (
    <>
      <form.AppForm>
        <form.Subscribe
          selector={(state) => ({
            agreements: state.values.agreements,
          })}
        >
          {({ agreements: formAgreements }) => {
            const isAllChecked
              = terms.length > 0
                && terms.every((term) => Boolean(formAgreements[term.id]));
            const hasRequiredUnchecked = terms.some(
              (term) => term.isRequired && !formAgreements[term.id],
            );

            const handleToggleAll = (checked: boolean) => {
              const next: Record<string, boolean> = {};
              for (const term of terms) {
                next[term.id] = checked;
              }
              form.setFieldValue('agreements', next);
            };

            return (
              <OnboardingLayout
                icon="shield-check"
                title={t('onboarding.termsTitle')}
                description={t('onboarding.termsSubtitle')}
                footer={(
                  <Button
                    type="submit"
                    form="terms-onboarding-form"
                    size="lg"
                    disabled={isSubmitting || hasRequiredUnchecked}
                    className="
                      h-11 w-full gap-2 text-sm font-bold shadow-md
                      transition-all
                    "
                  >
                    {isSubmitting
                      ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {t('onboarding.accepting')}
                        </>
                      )
                      : (
                        <>
                          <Check className="size-4" />
                          {t('onboarding.acceptAndContinue')}
                          <ArrowRight className="size-4" />
                        </>
                      )}
                  </Button>
                )}
              >
                <FormLayout
                  id="terms-onboarding-form"
                  onSubmit={() => void form.handleSubmit()}
                  className="grid gap-3"
                >
                  {/* Master "Agree to All" Checkbox Box */}
                  <div
                    className="
                      rounded-lg border border-primary/20 bg-primary/5 p-3.5
                      transition-all
                    "
                  >
                    <form.AppField name="agreeAll">
                      {(field) => (
                        <field.Checkbox
                          checked={isAllChecked}
                          onCheckedChange={(checked) =>
                            handleToggleAll(Boolean(checked))}
                          showError={false}
                          label={(
                            <span className="text-sm font-bold text-foreground">
                              {t('onboarding.agreeAll')}
                            </span>
                          )}
                          description={t('onboarding.agreeAllDescription')}
                        />
                      )}
                    </form.AppField>
                  </div>

                  {/* Individual Terms List using SectionCard */}
                  <div className="grid max-h-36 gap-2.5 scroll-y pr-1">
                    {terms.map((term) => (
                      <SectionCard
                        key={term.id}
                        variant="outline"
                        textSize="sm"
                        title={(
                          <form.AppField name={`agreements.${term.id}`}>
                            {(field) => (
                              <field.Checkbox
                                label={term.title}
                                showError={false}
                                className="
                                  text-xs font-semibold whitespace-nowrap
                                "
                              />
                            )}
                          </form.AppField>
                        )}
                      >
                        <SectionCard.Actions>
                          <Badge
                            variant={
                              term.isRequired ? 'default' : 'secondary'
                            }
                            className="text-[10px] font-bold tracking-wide"
                          >
                            {term.isRequired
                              ? t('onboarding.required')
                              : t('onboarding.optional')}
                          </Badge>

                          {term.content && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="
                                size-6 text-muted-foreground
                                hover:text-foreground
                              "
                              onClick={() => setSelectedTerm(term)}
                              title={t('onboarding.viewContent')}
                            >
                              <ChevronRight className="size-3.5" />
                            </Button>
                          )}
                        </SectionCard.Actions>
                      </SectionCard>
                    ))}
                  </div>
                </FormLayout>
              </OnboardingLayout>
            );
          }}
        </form.Subscribe>
      </form.AppForm>

      {/* Term Detail Modal Dialog */}
      <TermDetailDialog
        term={selectedTerm}
        onOpenChange={(open) => {
          if (!open) setSelectedTerm(null);
        }}
      />
    </>
  );
}
