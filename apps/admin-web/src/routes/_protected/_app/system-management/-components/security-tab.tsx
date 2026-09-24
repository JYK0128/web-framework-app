import { forwardRef, useImperativeHandle } from 'react';

import type { SecurityConfigDto } from '#/.generated/api/model';
import { Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';

export interface SecurityTabHandle {
  submitData: () => Promise<SecurityConfigDto | null>
}

export interface SecurityTabProps {
  security: SecurityConfigDto
}

export const SecurityTab = forwardRef<SecurityTabHandle, SecurityTabProps>(function SecurityTab(
  { security }: SecurityTabProps,
  ref,
) {

  const secForm = useAppForm({
    defaultValues: {
      registration: {
        allowRegistration: security.registration.allowRegistration,
        allowCredentialRegistration: security.registration.allowCredentialRegistration,
        requireEmailVerification: security.registration.requireEmailVerification,
      },
      session: {
        preventConcurrentLogin: security.session.preventConcurrentLogin,
        timeoutMinutes: security.session.timeoutMinutes,
        rememberMeDays: security.session.rememberMeDays,
      },
      lockout: {
        maxFailureAttempts: security.lockout.maxFailureAttempts,
        lockoutDurationMinutes: security.lockout.lockoutDurationMinutes,
      },
      password: {
        changeDeferDays: security.password.changeDeferDays,
        expirationDays: security.password.expirationDays,
        minLength: security.password.minLength,
        requireSpecialChar: security.password.requireSpecialChar,
        requireNumbers: security.password.requireNumbers,
        requireUppercase: security.password.requireUppercase,
        historyLimit: security.password.historyLimit,
      },
      twoFactor: {
        enforceAdmin2FA: security.twoFactor.enforceAdmin2FA,
        allowUser2FA: security.twoFactor.allowUser2FA,
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
          title={"신규 회원가입 정책"}
          description={"새로운 사용자의 서비스 회원가입 허용 여부를 설정합니다."}
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
                  {"신규 가입 활성화"}
                </div>
                <secForm.AppField name="registration.allowRegistration">
                  {(field) => (
                    <p className="text-xs text-muted-foreground">
                      {field.state.value
                        ? "현재 신규 회원가입이 허용되어 있습니다. 누구나 서비스를 통해 계정을 등록할 수 있습니다."
                        : "현재 신규 회원가입이 비활성화되어 있습니다. 관리자가 직접 등록한 사용자만 이용할 수 있습니다."}
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
                      aria-label={"신규 가입 활성화"}
                    />
                  </div>
                )}
              </secForm.AppField>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <secForm.AppField name="session.timeoutMinutes">
                  {(field) => <field.Input label="세션 만료 시간" placeholder="세션 만료 시간을 입력해 주세요." type="number" min={1} max={1440} rightSide="분" />}
                </secForm.AppField>
              </div>
              <div className="flex-1 min-w-[200px]">
                <secForm.AppField name="session.rememberMeDays">
                  {(field) => <field.Input label="로그인 유지 기간" placeholder="로그인 유지 기간을 입력해 주세요." type="number" min={1} max={365} rightSide="일" />}
                </secForm.AppField>
              </div>
            </div>

            {/* 로컬 패스워드 가입 허용 */}
            <div className="
              flex items-center justify-between gap-4 rounded-lg border
              bg-muted/20 p-3.5
            "
            >
              <div className="space-y-0.5">
                <div className="text-sm font-medium">
                  {"로컬(이메일/패스워드) 가입 허용"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {"비활성화 시 일반 이메일/비밀번호 가입이 차단되고 소셜 로그인(OAuth)으로만 가입할 수 있습니다."}
                </p>
              </div>
              <secForm.AppField name="registration.allowCredentialRegistration">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-label={"로컬(이메일/패스워드) 가입 허용"}
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
                  {"가입 시 이메일 인증 필수"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {"새로 가입하는 사용자는 이메일 인증 코드를 확인해야만 계정이 활성화됩니다."}
                </p>
              </div>
              <secForm.AppField name="registration.requireEmailVerification">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-label={"가입 시 이메일 인증 필수"}
                  />
                )}
              </secForm.AppField>
            </div>
          </SectionCard.Content>
        </SectionCard>

        {/* 2. 접속 보안 정책 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="shield"
          title={"접속 보안 정책"}
          description={"동일 계정 중복 로그인 제한 및 계정 잠금 정책을 설정합니다."}
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
                  {"중복 로그인 제한"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {"동일 계정으로 다른 기기 접속 시 기존 세션을 즉시 로그아웃합니다."}
                </p>
              </div>
              <secForm.AppField name="session.preventConcurrentLogin">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-label={"중복 로그인 제한"}
                  />
                )}
              </secForm.AppField>
            </div>

            {/* 계정 잠금 수치 입력 필드 */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <secForm.AppField name="lockout.maxFailureAttempts">
                  {(field) => (
                    <field.Input
                      label={"로그인 실패 허용 횟수"}
                      placeholder="허용 횟수를 입력해 주세요."
                      type="number"
                      min={3}
                      max={20}
                      rightSide="회"
                    />
                  )}
                </secForm.AppField>
              </div>

              <div className="flex-1 min-w-[200px]">
                <secForm.AppField name="lockout.lockoutDurationMinutes">
                  {(field) => (
                    <field.Input
                      label={"계정 잠금 지속 시간"}
                      placeholder="잠금 시간을 입력해 주세요."
                      type="number"
                      min={1}
                      max={1440}
                      rightSide="분"
                    />
                  )}
                </secForm.AppField>
              </div>
            </div>
          </SectionCard.Content>
        </SectionCard>

        {/* 3. 비밀번호 보안 정책 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="key-round"
          title={"비밀번호 보안 정책"}
          description={"비밀번호 최소 자릿수, 특수문자/숫자/대문자 조합 규칙, 이전 비밀번호 재사용 제한 및 변경 만료 주기를 설정합니다."}
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
                    {"특수문자 필수 포함"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {"비밀번호 생성 시 최소 1개 이상의 특수문자를 반드시 포함하도록 강제합니다."}
                  </p>
                </div>
                <secForm.AppField name="password.requireSpecialChar">
                  {(field) => (
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                      aria-label={"특수문자 필수 포함"}
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
                    {"숫자 필수 포함"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {"비밀번호 생성 시 최소 1개 이상의 숫자를 반드시 포함하도록 강제합니다."}
                  </p>
                </div>
                <secForm.AppField name="password.requireNumbers">
                  {(field) => (
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                      aria-label={"숫자 필수 포함"}
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
                    {"영문 대문자 필수 포함"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {"비밀번호 생성 시 최소 1개 이상의 영문 대문자를 반드시 포함하도록 강제합니다."}
                  </p>
                </div>
                <secForm.AppField name="password.requireUppercase">
                  {(field) => (
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                      aria-label={"영문 대문자 필수 포함"}
                    />
                  )}
                </secForm.AppField>
              </div>
            </div>

            {/* 비밀번호 길이, 재사용 제한 및 만료 주기 입력 필드 */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[170px]">
                <secForm.AppField name="password.minLength">
                  {(field) => (
                    <field.Input
                      label={"비밀번호 최소 자릿수"}
                      placeholder="최소 자릿수를 입력해 주세요."
                      type="number"
                      min={8}
                      max={32}
                      rightSide="자"
                    />
                  )}
                </secForm.AppField>
              </div>

              <div className="flex-1 min-w-[170px]">
                <secForm.AppField name="password.historyLimit">
                  {(field) => (
                    <field.Input
                      label={"이전 비밀번호 재사용 금지"}
                      placeholder="재사용 제한 개수를 입력해 주세요."
                      type="number"
                      min={0}
                      max={10}
                      rightSide="개"
                    />
                  )}
                </secForm.AppField>
              </div>

              <div className="flex-1 min-w-[170px]">
                <secForm.AppField name="password.changeDeferDays">
                  {(field) => (
                    <field.Input
                      label={"비밀번호 변경 유예 기간 (일)"}
                      placeholder="유예 기간을 입력해 주세요."
                      type="number"
                      min={1}
                      max={365}
                      rightSide="일"
                    />
                  )}
                </secForm.AppField>
              </div>

              <div className="flex-1 min-w-[170px]">
                <secForm.AppField name="password.expirationDays">
                  {(field) => (
                    <field.Input
                      label={"비밀번호 만료 주기"}
                      placeholder="만료 주기를 입력해 주세요."
                      type="number"
                      min={0}
                      max={365}
                      rightSide="일"
                    />
                  )}
                </secForm.AppField>
              </div>
            </div>
          </SectionCard.Content>
        </SectionCard>

        {/* 4. 2단계 인증 (2FA) 정책 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="shield-check"
          title={"2단계 인증 (2FA) 정책"}
          description={"OTP 및 다중 요인 인증(2FA) 적용 범위 및 보안 정책을 설정합니다."}
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
                  {"관리자 2단계 인증 의무화"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {"관리자 권한 계정은 로그인 시 2FA 인증을 필수로 거쳐야 합니다."}
                </p>
              </div>
              <secForm.AppField name="twoFactor.enforceAdmin2FA">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-label={"관리자 2단계 인증 의무화"}
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
                  {"일반 사용자 2단계 인증 지원"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {"일반 사용자가 자신의 프로필에서 직접 2단계 인증을 활성화할 수 있도록 허용합니다."}
                </p>
              </div>
              <secForm.AppField name="twoFactor.allowUser2FA">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-label={"일반 사용자 2단계 인증 지원"}
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
