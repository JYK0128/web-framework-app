import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Check, ChevronDown, ChevronUp, FileText, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { type SyntheticEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getAuthControllerUserProfileQueryKey, useAuthControllerLogout } from '#/.generated/api/endpoints/auth/auth';
import { getTermsControllerGetAgreementsQueryKey, useTermsControllerSetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto, TermAgreementItemDto } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Checkbox } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_protected/onboarding/term')({
  component: TermsOnboardingPage,
});

function TermsOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { agreements } = Route.useRouteContext();
  const { t } = useI18n();

  const logoutMutation = useAuthControllerLogout();
  const isLoggingOut = logoutMutation.isPending;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    }
    catch {
      // Proceed with client cleanup regardless
    }
    finally {
      queryClient.removeQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
      await navigate({ to: '/login', replace: true });
      queryClient.clear();
    }
  };

  return (
    <div className="
      flex min-h-dvh flex-col items-center justify-center bg-linear-to-b
      from-background via-muted/30 to-background p-4
      sm:p-6
    "
    >
      <div className="flex w-full max-w-lg flex-col gap-6">
        {/* Onboarding Header & Step Indicator */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="
            inline-flex items-center gap-2 rounded-full border border-primary/20
            bg-primary/10 px-3 py-1 text-xs font-semibold text-primary
          "
          >
            <span className="flex size-2 rounded-full bg-primary" />
            {t('onboarding.stepIndicator', { current: '2', total: '2' })}
            <span className="text-muted-foreground">·</span>
            <span>{t('onboarding.stepTerms')}</span>
          </div>

          {/* Progress bar (100%) */}
          <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
            <div className="
              size-full rounded-full bg-primary transition-all duration-500
            "
            />
          </div>
        </div>

        {/* Main Card */}
        <Card className="
          border border-border/80 bg-card/95 shadow-xl backdrop-blur-xl
        "
        >
          <CardHeader className="pb-4 text-center">
            <div className="
              mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl
              border border-primary/20 bg-linear-to-br from-primary/20
              to-primary/5 text-primary shadow-xs
            "
            >
              <ShieldCheck className="size-7" />
            </div>

            <CardTitle className="
              text-xl font-extrabold tracking-tight
              sm:text-2xl
            "
            >
              {t('onboarding.termsTitle')}
            </CardTitle>

            <CardDescription className="
              mx-auto mt-1.5 max-w-xs text-xs/relaxed text-muted-foreground
              sm:text-sm
            "
            >
              {t('onboarding.termsSubtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-3">
            <TermsAgreementForm agreements={agreements.terms} />
          </CardContent>

          <CardFooter className="
            flex justify-center border-t border-border/60 py-3.5 text-center
          "
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="
                h-8 gap-1.5 text-xs text-muted-foreground
                hover:text-foreground
                transition-colors
              "
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
            >
              {isLoggingOut
                ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {t('profileMenu.loggingOut')}
                  </>
                )
                : (
                  <>
                    <LogOut className="size-3.5" />
                    {t('onboarding.logoutPrompt')}
                  </>
                )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function TermsAgreementForm({ agreements }: { agreements: AgreementDto[] }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const terms = agreements.filter((term) => !term.isAgreed);

  const agreeTermsMutation = useTermsControllerSetAgreements();
  const isSubmitting = agreeTermsMutation.isPending;

  // Track expanded state for reading full terms content
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Local state for agreements
  const [selectedTerms, setSelectedTerms] = useState<Record<string, boolean>>(() => {
    return terms.reduce<Record<string, boolean>>((acc, term) => {
      acc[term.id] = false;
      return acc;
    }, {});
  });

  // Calculate master "Agree All" state
  const isAllChecked = useMemo(() => {
    if (terms.length === 0) return false;
    return terms.every((term) => selectedTerms[term.id]);
  }, [terms, selectedTerms]);

  const toggleAll = (checked: boolean) => {
    setSelectedTerms((prev) => {
      const next = { ...prev };
      for (const term of terms) {
        next[term.id] = checked;
      }
      return next;
    });
  };

  const toggleSingle = (id: string, checked: boolean) => {
    setSelectedTerms((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    const missingRequired = terms.some(
      (term) => term.isRequired && !selectedTerms[term.id],
    );

    if (missingRequired) {
      toast.error(t('onboarding.requiredTermsError'));
      return;
    }

    const payload: TermAgreementItemDto[] = terms
      .filter((term) => selectedTerms[term.id])
      .map((term) => ({
        id: term.id,
        isAgreed: true,
      }));

    await agreeTermsMutation.mutateAsync({ data: { agreements: payload } });
    await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAgreementsQueryKey() });
    await navigate({ to: '/dashboard', replace: true });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
      {/* Master "Agree to All" Checkbox Box */}
      <div className="
        flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5
        p-4 transition-all
        hover:border-primary/40 hover:bg-primary/10
      "
      >
        <Checkbox
          id="agree-all"
          checked={isAllChecked}
          onCheckedChange={(checked) => toggleAll(Boolean(checked))}
          className="mt-0.5"
        />
        <label
          htmlFor="agree-all"
          className="grid flex-1 cursor-pointer gap-0.5 select-none"
        >
          <span className="text-sm font-bold text-foreground">
            {t('onboarding.agreeAll')}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('onboarding.agreeAllDescription')}
          </span>
        </label>
      </div>

      <div className="h-px bg-border/60" />

      {/* Individual Terms List */}
      <div className="grid max-h-72 gap-2.5 overflow-y-auto pr-1">
        {terms.map((term) => {
          const isChecked = Boolean(selectedTerms[term.id]);
          const isExpanded = Boolean(expandedIds[term.id]);

          return (
            <div
              key={term.id}
              className={`
                rounded-xl border transition-all
                ${isChecked
              ? 'border-primary/30 bg-primary/5 shadow-2xs'
              : `
                border-border/70 bg-card/60
                hover:bg-muted/40
              `}
              `}
            >
              <div className="flex items-start gap-3 p-3.5">
                <Checkbox
                  id={`term-${term.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => toggleSingle(term.id, Boolean(checked))}
                  className="mt-0.5"
                />

                <div className="grid min-w-0 flex-1 gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor={`term-${term.id}`}
                      className="
                        cursor-pointer text-xs font-bold text-foreground
                        select-none
                      "
                    >
                      {term.title}
                    </label>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant={term.isRequired ? 'default' : 'secondary'}
                        className="
                          px-2 py-0.5 text-[10px] font-bold tracking-wide
                        "
                      >
                        {term.isRequired ? t('onboarding.required') : t('onboarding.optional')}
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
                          onClick={() => toggleExpanded(term.id)}
                          title={isExpanded ? t('onboarding.hideContent') : t('onboarding.viewContent')}
                        >
                          {isExpanded
                            ? (
                              <ChevronUp className="size-3.5" />
                            )
                            : (
                              <ChevronDown className="size-3.5" />
                            )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {term.content && (
                    <div
                      className={`
                        text-xs/relaxed text-muted-foreground transition-all
                        ${isExpanded
                      ? `
                        mt-1.5 rounded-lg border border-border/60 bg-muted/40
                        p-2.5
                      `
                      : 'line-clamp-2'}
                      `}
                    >
                      <div className="
                        flex items-center gap-1.5 font-medium text-foreground
                        mb-1
                      "
                      >
                        <FileText className="size-3 text-primary" />
                        <span>{term.title}</span>
                      </div>
                      <p className="whitespace-pre-line text-[11px]">
                        {term.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="
          mt-2 h-11 w-full gap-2 text-sm font-bold shadow-md transition-all
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
              {t('onboarding.acceptAndStart')}
              <ArrowRight className="ml-0.5 size-4" />
            </>
          )}
      </Button>
    </form>
  );
}
