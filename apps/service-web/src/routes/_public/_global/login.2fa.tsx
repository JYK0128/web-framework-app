import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { useI18n } from '@pkg/web-core/context';
import { Card, CardContent, FormLayout, FormSubmit, ScreenLayout, Separator, useAppForm } from '@pkg/web-core/ui';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useLocation, useNavigate } from '@tanstack/react-router';
import { ArrowRight, ShieldCheck } from 'lucide-react';

import { getAuthControllerMeV1QueryKey, useAuthControllerCompleteTwoFactorLoginV1 } from '~/.generated/api/endpoints/auth/auth';
import { authControllerCompleteTwoFactorLoginV1BodyCodeMax, authControllerCompleteTwoFactorLoginV1BodyCodeMin } from '~/.generated/api/zod/auth/auth';

export const Route = createFileRoute('/_public/_global/login/2fa')({
  validateSearch: z.object({ callback: z.string().optional() }),
  beforeLoad: ({ location }) => {
    if (!location.state.twoFactorChallengeToken) throw redirect({ to: '/login', replace: true });
  },
  component: TwoFactorLoginPage,
});

function TwoFactorLoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const twoFactorMutation = useAuthControllerCompleteTwoFactorLoginV1();
  const digits = Math.max(authControllerCompleteTwoFactorLoginV1BodyCodeMin, Math.min(SERVICE_AUTH_POLICY_CONFIG.twoFactorDigits, authControllerCompleteTwoFactorLoginV1BodyCodeMax));
  const twoFactorChallengeToken = location.state.twoFactorChallengeToken;
  const { callback } = Route.useSearch();

  const form = useAppForm({
    defaultValues: { code: '' },
    validators: {
      onSubmit: z.object({
        code: z.string().length(digits, t('app.auth.twoFactor.codeLength', { digits })),
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        await twoFactorMutation.mutateAsync({
          data: {
            twoFactorChallengeToken: twoFactorChallengeToken!,
            code: value.code,
          },
        });
        queryClient.removeQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        await navigate({ href: resolveDestination(callback), replace: true });
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          form.setErrorMap({ onSubmit: { fields: getValidationFieldErrors(error.details) } });
        }
        else {
          throw error;
        }
      }
    },
  });

  return (
    <ScreenLayout.Root>
      <ScreenLayout.Content size="md">
        <Card className="flex size-full flex-col shadow-xl">
          <CardContent className="flex-1 p-6">
            <div className="grid h-full grid-rows-[auto_1fr] gap-6">
              <div className="grid justify-items-center gap-2 text-center">
                <div className="
                  flex size-12 items-center justify-center rounded-2xl
                  bg-primary text-primary-foreground shadow-md
                "
                >
                  <ShieldCheck className="size-6 shrink-0" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">{t('app.auth.twoFactor.title')}</h1>
              </div>
              <form.AppForm>
                <FormLayout
                  id="service-two-factor-login-form"
                  onSubmit={() => void form.handleSubmit()}
                  className="h-full grid-rows-[1fr_auto] gap-6"
                >
                  <div className="scroll-y grid gap-10 justify-center">
                    <p className="text-sm text-muted-foreground">
                      {t('app.auth.twoFactor.codeHint', { digits })}
                    </p>
                    <form.AppField name="code">
                      {(field) => (
                        <field.OtpInput
                          aria-label={t('app.auth.twoFactor.codeLabel')}
                          containerClassName="justify-center"
                          maxLength={Math.min(digits, authControllerCompleteTwoFactorLoginV1BodyCodeMax)}
                          required
                        />
                      )}
                    </form.AppField>
                  </div>
                  <div className="grid gap-2">
                    <Separator
                      orientation="horizontal"
                      className="h-px w-full bg-border"
                    />
                    <FormSubmit variant="default" className="w-full" disabled={twoFactorMutation.isPending}>
                      <span>{twoFactorMutation.isPending ? t('app.auth.twoFactor.pending') : t('app.auth.twoFactor.submit')}</span>
                      <ArrowRight className="size-4" />
                    </FormSubmit>
                  </div>
                </FormLayout>
              </form.AppForm>
            </div>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
      <ScreenLayout.Addon>
        <Link
          to="/login"
          className="
            text-xs text-muted-foreground transition-colors
            hover:text-foreground
          "
        >
          ←
          {' '}
          {t('app.auth.twoFactor.back')}
        </Link>
      </ScreenLayout.Addon>
    </ScreenLayout.Root>
  );
}

function resolveDestination(callback?: string): string {
  if (!callback) return '/';
  try {
    const origin = 'https://service.invalid';
    const url = new URL(callback, origin);
    if (url.origin !== origin) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  }
  catch {
    return '/';
  }
}
