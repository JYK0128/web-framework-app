import { when, z } from '@pkg/shared/common';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, LogIn, RefreshCw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { useAuthControllerResetPassword, useAuthControllerVerifyPasswordResetToken } from '#/.generated/api/endpoints/auth/auth';
import type { ResetPasswordRequest } from '#/.generated/api/model';
import { AuthControllerResetPasswordBody } from '#/.generated/api/zod/auth/auth';
import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';
import { useI18n } from '#/hooks';

export const Route = createFileRoute('/_public/reset-password')({
  validateSearch: z.object({
    challengeId: z.string().optional(),
    token: z.string().optional(),
  }),
  component: ResetPasswordPageComponent,
});

function ResetPasswordPageComponent() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const challengeId = when((value): value is string => typeof value === 'string', (value) => value)(search.challengeId);
  const token = when((value): value is string => typeof value === 'string', (value) => value)(search.token);

  const isMissingParams = !challengeId || !token;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token
  const { data: tokenStatus, isLoading: isCheckingToken } = useAuthControllerVerifyPasswordResetToken(
    { challengeId: challengeId ?? '', token: token ?? '' },
    {
      query: {
        enabled: !isMissingParams,
        retry: false,
      },
    },
  );

  const resetPasswordMutation = useAuthControllerResetPassword();

  const resetForm = useAppForm({
    defaultValues: {
      challengeId: challengeId ?? '',
      token: token ?? '',
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: AuthControllerResetPasswordBody,
    },
    onSubmit: async ({ value }) => {
      const payload: ResetPasswordRequest = {
        challengeId: challengeId!,
        token: token!,
        newPassword: value.newPassword,
        confirmPassword: value.confirmPassword,
      };
      await resetPasswordMutation.mutateAsync({
        data: payload,
      });
      setIsSuccess(true);
    },
  });

  const isInvalidToken = isMissingParams || (!isCheckingToken && !tokenStatus?.isValid);

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <CardContent className="p-6">
            <div className="min-h-[230px] flex flex-col justify-between">
              {/* 1. 로딩 상태 */}
              {isCheckingToken && (
                <div className="
                  flex flex-col items-center justify-center h-full text-center
                "
                >
                  <Loader2 className="size-8 animate-spin text-primary mb-3" />
                  <p className="text-sm font-medium text-foreground">{t('resetPassword.verifyingToken')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('resetPassword.pleaseWait')}</p>
                </div>
              )}

              {/* 2. 만료/유효하지 않은 링크 상태 */}
              {!isCheckingToken && isInvalidToken && (
                <div className="
                  flex flex-col justify-between h-full py-1 text-center
                "
                >
                  <div className="my-auto grid gap-3 py-2">
                    <div className="
                      mx-auto flex size-12 items-center justify-center
                      rounded-full bg-destructive/10 text-destructive
                    "
                    >
                      <AlertCircle className="size-6" />
                    </div>
                    <div className="grid gap-1">
                      <h3 className="text-base font-bold text-destructive">
                        {t('resetPassword.invalidTokenTitle')}
                      </h3>
                      <p className="
                        text-xs/relaxed text-muted-foreground
                        whitespace-pre-line
                      "
                      >
                        {t('resetPassword.invalidTokenDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 pt-2">
                    <Button
                      type="button"
                      render={<Link to="/find-account" hash="password" search={{ tab: 'password' }} />}
                      className="w-full"
                    >
                      <RefreshCw className="size-4 mr-1.5" />
                      <span>{t('resetPassword.requestNewLink')}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      render={<Link to="/login" />}
                      className="w-full text-xs"
                    >
                      <span>{t('resetPassword.backToLogin')}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* 3. 성공 상태 */}
              {!isCheckingToken && !isInvalidToken && isSuccess && (
                <div className="
                  flex flex-col justify-between h-full py-1 text-center
                "
                >
                  <div className="my-auto grid gap-3 py-2">
                    <div className="
                      mx-auto flex size-12 items-center justify-center
                      rounded-full bg-emerald-500/10 text-emerald-500
                    "
                    >
                      <CheckCircle2 className="size-6" />
                    </div>
                    <div className="grid gap-1">
                      <h3 className="text-base font-bold text-foreground">
                        {t('resetPassword.successTitle')}
                      </h3>
                      <p className="
                        text-xs/relaxed text-muted-foreground
                        whitespace-pre-line
                      "
                      >
                        {t('resetPassword.successDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      render={<Link to="/login" />}
                      className="w-full"
                    >
                      <LogIn className="size-4 mr-1.5" />
                      <span>{t('resetPassword.goToLogin')}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* 4. 새 비밀번호 입력 폼 상태 */}
              {!isCheckingToken && !isInvalidToken && !isSuccess && (
                <div className="flex flex-col justify-between h-full py-1">
                  <div>
                    <div className="flex items-center gap-1.5 text-primary mb-1">
                      <ShieldCheck className="size-4" />
                      <span className="
                        text-[11px] font-semibold uppercase tracking-wider
                      "
                      >
                        {t('resetPassword.securityVerified')}
                      </span>
                    </div>
                    <h2 className="
                      text-lg font-bold tracking-tight text-foreground
                    "
                    >
                      {t('resetPassword.title')}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tokenStatus?.maskedEmail && (
                        <span className="font-semibold text-foreground mr-1">
                          [
                          {tokenStatus.maskedEmail}
                          ]
                        </span>
                      )}
                      {t('resetPassword.description')}
                    </p>
                  </div>

                  <resetForm.AppForm>
                    <FormLayout
                      id="reset-password-form"
                      onSubmit={() => void resetForm.handleSubmit()}
                      className="grid gap-3 my-auto py-2"
                    >
                      <resetForm.AppField name="newPassword">
                        {(field) => (
                          <field.Input
                            type={showPassword ? 'text' : 'password'}
                            label={t('resetPassword.newPasswordLabel')}
                            placeholder={t('resetPassword.newPasswordPlaceholder')}
                            autoComplete="new-password"
                            leftSide={(
                              <Lock className="
                                size-4 text-muted-foreground shrink-0
                              "
                              />
                            )}
                            rightSide={(
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="
                                  text-muted-foreground
                                  hover:text-foreground
                                  p-1 transition-colors
                                "
                                tabIndex={-1}
                              >
                                {showPassword
                                  ? <EyeOff className="size-4" />
                                  : (
                                    <Eye className="size-4" />
                                  )}
                              </button>
                            )}
                            required
                          />
                        )}
                      </resetForm.AppField>

                      <resetForm.AppField name="confirmPassword">
                        {(field) => (
                          <field.Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            label={t('resetPassword.confirmPasswordLabel')}
                            placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                            autoComplete="new-password"
                            leftSide={(
                              <Lock className="
                                size-4 text-muted-foreground shrink-0
                              "
                              />
                            )}
                            rightSide={(
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="
                                  text-muted-foreground
                                  hover:text-foreground
                                  p-1 transition-colors
                                "
                                tabIndex={-1}
                              >
                                {showConfirmPassword
                                  ? <EyeOff className="size-4" />
                                  : (
                                    <Eye className="size-4" />
                                  )}
                              </button>
                            )}
                            required
                          />
                        )}
                      </resetForm.AppField>

                      <resetForm.Subscribe selector={(state) => state.isSubmitting}>
                        {(isSubmitting) => (
                          <Button
                            type="submit"
                            form="reset-password-form"
                            disabled={isSubmitting}
                            className="w-full mt-1"
                          >
                            <span>{isSubmitting ? t('resetPassword.changing') : t('resetPassword.submitReset')}</span>
                            <ArrowRight className="size-4 shrink-0 ml-1.5" />
                          </Button>
                        )}
                      </resetForm.Subscribe>
                    </FormLayout>
                  </resetForm.AppForm>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </ScreenLayout.Content>

      <ScreenLayout.Addon>
        <div className="flex w-full items-center justify-start">
          <Link
            to="/login"
            className="
              text-xs text-muted-foreground
              hover:text-foreground
              transition-colors
            "
          >
            ←
            {' '}
            {t('resetPassword.backToLogin')}
          </Link>
        </div>
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}
