import type { SecurityConfigDto } from '#/.generated/api/model';
import { Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export interface SecurityTabProps {
  security?: Partial<SecurityConfigDto>
  onSave: (security: SecurityConfigDto) => Promise<void>
}

export function SecurityTab({
  security,
  onSave,
}: SecurityTabProps) {
  const { t } = useI18n();

  const secForm = useAppForm({
    defaultValues: {
      registration: {
        allowRegistration: security?.registration?.allowRegistration ?? true,
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
      },
    },
    onSubmit: async ({ value }) => {
      await onSave({
        registration: {
          allowRegistration: value.registration.allowRegistration,
        },
        session: {
          sessionTimeoutMinutes: Number(value.session.sessionTimeoutMinutes) || 30,
          preventConcurrentLogin: value.session.preventConcurrentLogin,
        },
        lockout: {
          maxFailureAttempts: Number(value.lockout.maxFailureAttempts) || 5,
          lockoutDurationMinutes: Number(value.lockout.lockoutDurationMinutes) || 15,
        },
        password: {
          expirationDays: Number(value.password.expirationDays) || 0,
          minLength: Number(value.password.minLength) || 8,
          requireSpecialChar: value.password.requireSpecialChar,
        },
      });
    },
  });

  return (
    <secForm.AppForm>
      <FormLayout
        id="security-form"
        onSubmit={() => void secForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        {/* 1. 신규 회원가입 정책 (방안 B: 엔터프라이즈 행 카드) */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="user-plus"
          title={t('systemManagement.security.registrationTitle')}
          description={t('systemManagement.security.registrationDescription')}
        >
          <SectionCard.Content>
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
            {/* 특수문자 필수 포함 설정 행 */}
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

            {/* 비밀번호 길이 및 만료 주기 입력 필드 */}
            <div className="
              grid grid-cols-1 gap-4
              sm:grid-cols-2
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
      </FormLayout>
    </secForm.AppForm>
  );
}
