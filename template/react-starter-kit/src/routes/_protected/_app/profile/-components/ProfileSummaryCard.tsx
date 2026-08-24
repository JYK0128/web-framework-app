import { useI18n } from '@pkg/shared/web';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, Lock, Mail, Phone, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import type { ReactNode } from 'react';

import type { AuthPrincipalResponse } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

type ProfileSummaryCardProps = {
  user: AuthPrincipalResponse
  onOpenPasswordModal: () => void
  onOpenEmailModal: () => void
  onOpen2FAModal: () => void
  onTurnOff2FA: () => void
  onVerifyIdentity: () => void
  isIdentityVerifying?: boolean
  isGeneratingQr?: boolean
};

function CheckpointRow({
  icon,
  isPassed,
  title,
  description,
  action,
}: {
  icon: ReactNode
  isPassed: boolean
  title: string
  description: string
  action: ReactNode
}) {
  const iconStyle = isPassed
    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
    : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';

  return (
    <div className="flex items-center justify-between py-3.5 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`
          flex size-8 shrink-0 items-center justify-center rounded-lg border
          ${iconStyle}
        `}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-foreground block">{title}</span>
          <p className="text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function ProfileSummaryHeader({
  user,
}: {
  user: AuthPrincipalResponse
}) {
  const { t } = useI18n();

  const getRoleLabel = () => {
    if (user.role === 'super-admin') return t('users.superAdminRole');
    if (user.role === 'admin') return t('users.adminRole');
    return t('users.userRole');
  };

  return (
    <CardHeader className="
      flex flex-col gap-4
      sm:flex-row sm:items-center sm:justify-between
      pb-4
    "
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="
          flex size-14 shrink-0 items-center justify-center rounded-2xl
          bg-primary/10 text-primary ring-4 ring-primary/5 shadow-inner
        "
        >
          <User className="size-7" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-xl font-extrabold tracking-tight">
              {user.name || t('profile.userFallback')}
            </CardTitle>
            <Badge
              variant={user.role === 'admin' || user.role === 'super-admin' ? 'default' : 'secondary'}
              className="text-xs font-semibold px-2 py-0.5"
            >
              {getRoleLabel()}
            </Badge>
            {user.emailVerified && (
              <Badge
                variant="outline"
                className="
                  text-emerald-600 border-emerald-300/80 bg-emerald-50/70
                  dark:bg-emerald-950/40 dark:border-emerald-800
                  text-xs gap-1 font-medium
                "
              >
                <CheckCircle2 className="size-3" />
                <span>{t('profile.emailVerified')}</span>
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {t('profile.subtitle')}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

function SecurityScoreBadge({ passedCount }: { passedCount: number }) {
  const { t } = useI18n();
  const isExcellent = passedCount === 4;
  const isWarning = passedCount <= 2;

  let badgeVariant: 'default' | 'destructive' | 'secondary' = 'secondary';
  if (isExcellent) {
    badgeVariant = 'default';
  }
  else if (isWarning) {
    badgeVariant = 'destructive';
  }

  return (
    <Badge
      variant={badgeVariant}
      className="text-xs font-semibold px-2.5 py-0.5 gap-1"
    >
      {isExcellent
        ? (
          <>
            <CheckCircle2 className="size-3" />
            <span>{t('profile.securityComplete')}</span>
          </>
        )
        : (
          <>
            <ShieldAlert className="size-3" />
            <span>{t('profile.securityRecommendation')}</span>
          </>
        )}
      <span className="opacity-80">
        (
        {passedCount}
        /4)
      </span>
    </Badge>
  );
}

function TwoFactorAction({
  isTwoFactorEnabled,
  isGeneratingQr,
  onTurnOff2FA,
  onOpen2FAModal,
}: {
  isTwoFactorEnabled: boolean
  isGeneratingQr: boolean
  onTurnOff2FA: () => void
  onOpen2FAModal: () => void
}) {
  const { t } = useI18n();

  if (isTwoFactorEnabled) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="
          h-7.5 gap-1 text-xs text-destructive
          hover:bg-destructive/10
          dark:hover:bg-destructive/20
          shrink-0 cursor-pointer
        "
        onClick={onTurnOff2FA}
      >
        <span>{t('profile.disableTwoFactor')}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="
        h-7.5 gap-1 text-xs text-amber-600 border-amber-300/80
        hover:bg-amber-50
        dark:border-amber-700
        dark:hover:bg-amber-950/30
        shrink-0 cursor-pointer
      "
      onClick={onOpen2FAModal}
      disabled={isGeneratingQr}
    >
      <Lock className="size-3" />
      <span>{isGeneratingQr ? t('profile.generatingQr') : t('profile.startTwoFactorSetup')}</span>
    </Button>
  );
}

export function ProfileSummaryCard({
  user,
  onOpenPasswordModal,
  onOpenEmailModal,
  onOpen2FAModal,
  onTurnOff2FA,
  onVerifyIdentity,
  isIdentityVerifying = false,
  isGeneratingQr = false,
}: ProfileSummaryCardProps) {
  const { t } = useI18n();

  const isPhoneVerified = Boolean(user.phoneNumberVerified);
  const isEmailVerified = Boolean(user.emailVerified);
  const isTwoFactorEnabled = Boolean(user.twoFactorEnabled);
  const isPasswordChangeRequired = Boolean(user.isPasswordChangeRequired);
  const passwordUpdatedAt = user.passwordUpdatedAt ? new Date(user.passwordUpdatedAt) : null;

  const securityChecks = [
    isPhoneVerified,
    isEmailVerified,
    isTwoFactorEnabled,
    !isPasswordChangeRequired,
  ];
  const passedCount = securityChecks.filter(Boolean).length;

  const passwordDescription = passwordUpdatedAt
    ? `${t('profile.lastPasswordChange')}: ${format(passwordUpdatedAt, 'yyyy.MM.dd')}`
    : t('profile.passwordChangeDescription');

  return (
    <Card className="overflow-hidden shadow-xs border-border/80">
      <ProfileSummaryHeader user={user} />

      <CardContent className="pt-2">
        <div className="border-t pt-4">
          <div className="
            flex items-center justify-between gap-2 pb-3 flex-wrap
          "
          >
            <div className="flex items-center gap-2">
              <div className="
                flex size-7 shrink-0 items-center justify-center rounded-lg
                bg-primary/10 text-primary
              "
              >
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground leading-none">
                  {t('profile.securityChecklistTitle')}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('profile.securityChecklistDesc')}
                </p>
              </div>
            </div>

            <SecurityScoreBadge passedCount={passedCount} />
          </div>

          <div className="divide-y divide-border/60 text-xs">
            {/* 1. 연락처 본인인증 */}
            <CheckpointRow
              icon={<Phone className="size-4" />}
              isPassed={isPhoneVerified}
              title={t('profile.phoneNumber')}
              description={user.phoneNumber || t('profile.phoneNotSet')}
              action={(
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7.5 gap-1 text-xs shrink-0 cursor-pointer"
                  onClick={onVerifyIdentity}
                  disabled={isIdentityVerifying}
                >
                  {isIdentityVerifying
                    ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        <span>{t('profile.verifyingIdentity')}</span>
                      </>
                    )
                    : (
                      <>
                        <Phone className="size-3 text-primary" />
                        <span>{isPhoneVerified ? t('profile.changePhoneNumber') : t('profile.identityVerificationAction')}</span>
                      </>
                    )}
                </Button>
              )}
            />

            {/* 2. 이메일 인증 */}
            <CheckpointRow
              icon={<Mail className="size-4" />}
              isPassed={isEmailVerified}
              title={t('profile.emailAccount')}
              description={user.email}
              action={(
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7.5 gap-1 text-xs shrink-0 cursor-pointer"
                  onClick={onOpenEmailModal}
                >
                  <Mail className="size-3 text-primary" />
                  <span>{t('profile.changeEmail')}</span>
                </Button>
              )}
            />

            {/* 3. 비밀번호 관리 */}
            <CheckpointRow
              icon={<KeyRound className="size-4" />}
              isPassed={!isPasswordChangeRequired}
              title={t('profile.changePassword')}
              description={passwordDescription}
              action={(
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7.5 gap-1 text-xs shrink-0 cursor-pointer"
                  onClick={onOpenPasswordModal}
                >
                  <span>{t('profile.changePassword')}</span>
                </Button>
              )}
            />

            {/* 4. 2단계 인증 (2FA) */}
            <CheckpointRow
              icon={isTwoFactorEnabled
                ? <ShieldCheck className="size-4" />
                : (
                  <AlertTriangle className="size-4" />
                )}
              isPassed={isTwoFactorEnabled}
              title={t('profile.twoFactorTitle')}
              description={isTwoFactorEnabled ? t('profile.twoFactorActive') : t('profile.twoFactorSetupDescriptionShort')}
              action={(
                <TwoFactorAction
                  isTwoFactorEnabled={isTwoFactorEnabled}
                  isGeneratingQr={isGeneratingQr}
                  onTurnOff2FA={onTurnOff2FA}
                  onOpen2FAModal={onOpen2FAModal}
                />
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
