import { forwardRef, useImperativeHandle } from 'react';

import type { SecurityConfigDto } from '#/.generated/api/model';
import { Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export interface SecurityTabHandle {
  submitData: () => Promise<SecurityConfigDto | null>
}

export interface SecurityTabProps {
  security?: Partial<SecurityConfigDto>
}

export const SecurityTab = forwardRef<SecurityTabHandle, SecurityTabProps>(function SecurityTab(
  { security }: SecurityTabProps,
  ref,
) {
  const { t } = useI18n();

  const secForm = useAppForm({
    defaultValues: {
      registration: {
        allowRegistration: security?.registration?.allowRegistration ?? true,
        allowPasswordRegistration: security?.registration?.allowPasswordRegistration ?? true,
        requireEmailVerification: security?.registration?.requireEmailVerification ?? false,
      },
      session: {
        sessionTimeoutMinutes: security?.session?.sessionTimeoutMinutes ?? 30,
        preventConcurrentLogin: security?.session?.preventConcurrentLogin ?? false,
      },
      lockout: {
        maxFailureAttempts: security?.lockout?.maxFailureAttempts ?? 5,
        lockoutDurationMinutes: security?.lockout?.lockoutDurationMinutes ?? 15,
      },
      password: {
        expirationDays: security?.password?.expirationDays ?? 90,
        minLength: security?.password?.minLength ?? 8,
        requireSpecialChar: security?.password?.requireSpecialChar ?? true,
        requireNumbers: security?.password?.requireNumbers ?? true,
        requireUppercase: security?.password?.requireUppercase ?? false,
        historyLimit: security?.password?.historyLimit ?? 3,
      },
      twoFactor: {
        enforceAdmin2FA: security?.twoFactor?.enforceAdmin2FA ?? false,
        allowUser2FA: security?.twoFactor?.allowUser2FA ?? true,
      },
    },
  });

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      const isValid = await secForm.validateAllFields('submit');
      if (!isValid) {
        return null;
      }
      return secForm.state.values;
    },
  }));

  return (
    <secForm.AppForm>
      <FormLayout
        id="security-form"
        onSubmit={() => void secForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        {/* 1. 신규 회원가입 정책 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="user-plus"
          title={t('systemManagement.security.registrationTitle')}
          description={t('systemManagement.security.registrationDescription')}
        >
          <SectionCard.Content className="flex flex-col gap-3.5">
            {/* 기본 회원가입 활성화 */}
            <div className="
              flex flex-col gap-4 rounded-lg border bg-muted/20 p-4
              sm:flex-row sm:items-center sm:justify-between
            "
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold">
                  {t('systemManagement.security.allowRegistration')}
                </div>
                <secForm.AppField name="registration.allowRegistration">
                  {(field) => (
                    <p className="text-xs text-muted-foreground">
                      {field.state.value
                        ? t('systemManagement.security.registrationAllowedDesc')
                        : t('systemManagement.security.registrationBlockedDesc')}
                    </p>
                  )}
                </secForm.AppField>
              </div>

              <secForm.AppField name="registration.allowRegistration">
                {(field) => (
                  <div className="flex items-center">
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                      aria-label={t('systemManagement.security.allowRegistration')}
                    />
                  </div>
                )}
              </secForm.AppField>
            </div>

            {/* 로컬 패스워드 가입 허용 */}
            <div className="
              flex items-center justify-between gap-4 rounded-lg border
              bg-muted/20 p-3.5
            "
            >
              <div className="space-y-0.5">
                <div className="text-sm font-medium">
                  {t('systemManagement.security.allowPasswordRegistration')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('systemManagement.security.allowPasswordRegistrationDesc')}
                </p>
              </div>
              <secForm.AppField name="registration.allowPasswordRegistration">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-label={t('systemManagement.security.allowPasswordRegistration')}
                  />
                )}
              </secForm.AppField>
            </div>

            {/* 이메일 인증 필수 */}
            <div className="
              flex items-center justify-between gap-4 rounded-lg border
              bg-muted/20 p-3.5
            "
            >
              <div className="space-y-0.5">
                <div className="text-sm font-medium">
                  {t('systemManagement.security.requireEmailVerification')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('systemManagement.security.requireEmailVerificationDesc')}
                </p>
              </div>
              <secForm.AppField name="registration.requireEmailVerification">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-label={t('systemManagement.security.requireEmailVerification')}
                  />
                )}
              </secForm.AppField>
            </div>
          </SectionCard.Content>
        </SectionCard>

        {/* 2. 세션 및 접속 보안 정책 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="shield"
          title={t('systemManagement.security.sessionTitle')}
          description={t('systemManagement.security.sessionDescription')}
        >
          <SectionCard.Content className="flex flex-col gap-5">
            {/* 중복 로그인 방지 설정 행 */}
            <div className="
              flex items-center justify-between gap-4 rounded-lg border
              bg-muted/20 p-3.5
            "
            >
              <div className="space-y-0.5">
                <div className="text-sm font-medium">
                  {t('systemManagement.security.preventConcurrentLogin')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('systemManagement.security.preventConcurrentLoginDesc')}
                </p>
              </div>
              <secForm.AppField name="session.preventConcurrentLogin">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-label={t('systemManagement.security.preventConcurrentLogin')}
                  />
                )}
              </secForm.AppField>
            </div>

            {/* 세션 & 계정 잠금 수치 입력 필드 */}
            <div className="
              grid grid-cols-1 gap-4
              sm:grid-cols-3
            "
            >
              <secForm.AppField name="session.sessionTimeoutMinutes">
                {(field) => (
                  <field.Input
                    label={t('systemManagement.security.sessionTimeout')}
                    type="number"
                    min={10}
                    max={1440}
                    rightSide="분"
                  />
                )}
              </secForm.AppField>

              <secForm.AppField name="lockout.maxFailureAttempts">
                {(field) => (
                  <field.Input
                    label={t('systemManagement.security.loginFailureThreshold')}
                    type="number"
                    min={3}
                    max={20}
                    rightSide="회"
                  />
                )}
              </secForm.AppField>

              <secForm.AppField name="lockout.lockoutDurationMinutes">
                {(field) => (
                  <field.Input
                    label={t('systemManagement.security.loginLockDuration')}
                    type="number"
                    min={1}
                    max={1440}
                    rightSide="분"
                  />
                )}
              </secForm.AppField>
            </div>
          </SectionCard.Content>
        </SectionCard>

        {/* 3. 비밀번호 보안 정책 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="key-round"
          title={t('systemManagement.security.passwordTitle')}
          description={t('systemManagement.security.passwordDescription')}
        >
          <SectionCard.Content className="flex flex-col gap-5">
            {/* 특수문자, 숫자, 영문 대문자 토글 행 */}
            <div className="flex flex-col gap-3.5">
              <div className="
                flex items-center justify-between gap-4 rounded-lg border
                bg-muted/20 p-3.5
              "
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">
                    {t('systemManagement.security.requireSpecialChar')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('systemManagement.security.requireSpecialCharDesc')}
                  </p>
                </div>
                <secForm.AppField name="password.requireSpecialChar">
                  {(field) => (
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                      aria-label={t('systemManagement.security.requireSpecialChar')}
                    />
                  )}
                </secForm.AppField>
              </div>

              <div className="
                flex items-center justify-between gap-4 rounded-lg border
                bg-muted/20 p-3.5
              "
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">
                    {t('systemManagement.security.requireNumbers')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('systemManagement.security.requireNumbersDesc')}
                  </p>
                </div>
                <secForm.AppField name="password.requireNumbers">
                  {(field) => (
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                      aria-label={t('systemManagement.security.requireNumbers')}
                    />
                  )}
                </secForm.AppField>
              </div>

              <div className="
                flex items-center justify-between gap-4 rounded-lg border
                bg-muted/20 p-3.5
              "
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">
                    {t('systemManagement.security.requireUppercase')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('systemManagement.security.requireUppercaseDesc')}
                  </p>
                </div>
                <secForm.AppField name="password.requireUppercase">
                  {(field) => (
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                      aria-label={t('systemManagement.security.requireUppercase')}
                    />
                  )}
                </secForm.AppField>
              </div>
            </div>

            {/* 비밀번호 길이, 재사용 제한 및 만료 주기 입력 필드 */}
            <div className="
              grid grid-cols-1 gap-4
              sm:grid-cols-3
            "
            >
              <secForm.AppField name="password.minLength">
                {(field) => (
                  <field.Input
                    label={t('systemManagement.security.minLength')}
                    type="number"
                    min={8}
                    max={32}
                    rightSide="자"
                  />
                )}
              </secForm.AppField>

              <secForm.AppField name="password.historyLimit">
                {(field) => (
                  <field.Input
                    label={t('systemManagement.security.historyLimit')}
                    type="number"
                    min={0}
                    max={10}
                    rightSide="개"
                  />
                )}
              </secForm.AppField>

              <secForm.AppField name="password.expirationDays">
                {(field) => (
                  <field.Input
                    label={t('systemManagement.security.passwordExpiration')}
                    type="number"
                    min={0}
                    max={365}
                    rightSide="일"
                  />
                )}
              </secForm.AppField>
            </div>
          </SectionCard.Content>
        </SectionCard>

        {/* 4. 2단계 인증 (2FA) 정책 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="shield-check"
          title={t('systemManagement.security.twoFactorTitle')}
          description={t('systemManagement.security.twoFactorDescription')}
        >
          <SectionCard.Content className="flex flex-col gap-3.5">
            {/* 관리자 2FA 의무화 토글 */}
            <div className="
              flex items-center justify-between gap-4 rounded-lg border
              bg-muted/20 p-3.5
            "
            >
              <div className="space-y-0.5">
                <div className="text-sm font-medium">
                  {t('systemManagement.security.enforceAdmin2FA')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('systemManagement.security.enforceAdmin2FADesc')}
                </p>
              </div>
              <secForm.AppField name="twoFactor.enforceAdmin2FA">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-label={t('systemManagement.security.enforceAdmin2FA')}
                  />
                )}
              </secForm.AppField>
            </div>

            {/* 일반 사용자 2FA 지원 토글 */}
            <div className="
              flex items-center justify-between gap-4 rounded-lg border
              bg-muted/20 p-3.5
            "
            >
              <div className="space-y-0.5">
                <div className="text-sm font-medium">
                  {t('systemManagement.security.allowUser2FA')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('systemManagement.security.allowUser2FADesc')}
                </p>
              </div>
              <secForm.AppField name="twoFactor.allowUser2FA">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-label={t('systemManagement.security.allowUser2FA')}
                  />
                )}
              </secForm.AppField>
            </div>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </secForm.AppForm>
  );
});
