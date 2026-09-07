import { ApplicationError, formatDateTime, z } from '@pkg/shared/common';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, ArrowRight, Check, CheckCircle2, Copy, ExternalLink, KeyRound, Mail, Phone, RefreshCw, Sparkles, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuthControllerFindId, useAuthControllerIssuePasswordResetChallenge } from '#/.generated/api/endpoints/auth/auth';
import type { FindIdItem } from '#/.generated/api/model';
import { AuthControllerIssuePasswordResetChallengeBody } from '#/.generated/api/zod/auth/auth';
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';
import { useI18n } from '#/hooks';

export const Route = createFileRoute('/_public/find-account/')({
  validateSearch: z.object({
    tab: z.enum(['id', 'password']).optional(),
  }),
  component: FindAccountPageComponent,
});

function getProviderLabel(t: (key: string) => string, provider: string): { label: string, variant: 'default' | 'secondary' | 'outline' } {
  switch (provider.toLowerCase()) {
    case 'google':
      return { label: t('findAccount.providerGoogle'), variant: 'outline' };
    case 'kakao':
      return { label: t('findAccount.providerKakao'), variant: 'secondary' };
    case 'naver':
      return { label: t('findAccount.providerNaver'), variant: 'secondary' };
    case 'github':
      return { label: t('findAccount.providerGithub'), variant: 'outline' };
    case 'credential':
    default:
      return { label: t('findAccount.providerEmail'), variant: 'default' };
  }
}

function FindAccountPageComponent() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeTab = search.tab ?? 'id';

  // ID Search State
  const [foundAccounts, setFoundAccounts] = useState<FindIdItem[] | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const findIdMutation = useAuthControllerFindId();

  // Password Reset State
  const [resetSentInfo, setResetSentInfo] = useState<{
    email: string
    devMagicLink?: string
    isOAuthUser?: boolean
    oauthProvider?: string
  } | null>(null);
  const issueResetMutation = useAuthControllerIssuePasswordResetChallenge();

  const idForm = useAppForm({
    defaultValues: {
      name: '',
      phoneNumber: '',
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, t('findAccount.nameRequired')),
        phoneNumber: z.string(),
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await findIdMutation.mutateAsync({
          data: {
            name: value.name.trim(),
            phoneNumber: value.phoneNumber?.trim() || undefined,
          },
        });
        setFoundAccounts(response.items);
      }
      catch (err) {
        if (err instanceof ApplicationError && err.code === 'USER_NOT_FOUND') {
          toast.error(t('findAccount.notFound'));
        }
        else {
          toast.error(err instanceof Error ? err.message : t('findAccount.searchError'));
        }
      }
    },
  });

  const passwordForm = useAppForm({
    defaultValues: {
      email: '',
    },
    validators: {
      onSubmit: AuthControllerIssuePasswordResetChallengeBody,
    },
    onSubmit: async ({ value }) => {
      try {
        const email = value.email.trim().toLowerCase();
        const response = await issueResetMutation.mutateAsync({
          data: { email },
        });
        setResetSentInfo({
          email,
          devMagicLink: response.devMagicLink,
          isOAuthUser: response.isOAuthUser,
          oauthProvider: response.oauthProvider,
        });
      }
      catch (err) {
        toast.error(err instanceof Error ? err.message : t('findAccount.requestResetError'));
      }
    },
  });

  const handleCopy = (email: string) => {
    void navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success(t('findAccount.copiedSuccess'));
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleTabChange = (val: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        tab: val as 'id' | 'password',
      }),
      replace: true,
    });
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full flex flex-col"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="id">
                    {t('findAccount.tabFindId')}
                  </TabsTrigger>
                  <TabsTrigger value="password">
                    {t('findAccount.tabResetPassword')}
                  </TabsTrigger>
                </TabsList>

                {/* 1. 아이디 찾기 탭 */}
                <TabsContent
                  value="id"
                  className="
                    mt-4 min-h-[230px] flex flex-col justify-between
                    outline-none
                  "
                >
                  {foundAccounts
                    ? (
                      <div className="flex flex-col justify-between h-full py-1">
                        <div className="grid gap-3">
                          <div className="
                            flex items-center gap-2 rounded-lg bg-primary/10 p-3
                            text-xs text-primary
                          "
                          >
                            <Sparkles className="size-4 shrink-0" />
                            <span>{t('findAccount.foundSuccess')}</span>
                          </div>

                          <div className="
                            max-h-[220px] overflow-y-auto grid gap-2 pr-0.5
                          "
                          >
                            {foundAccounts.map((account, idx) => {
                              const providerMeta = getProviderLabel(t, account.provider);
                              return (
                                <div
                                  key={idx}
                                  className="
                                    flex items-center justify-between p-3
                                    rounded-lg border bg-card/60
                                    hover:border-primary/40
                                    transition-colors
                                  "
                                >
                                  <div className="grid gap-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="
                                        font-mono text-sm font-semibold
                                        text-foreground
                                      "
                                      >
                                        {account.maskedEmail}
                                      </span>
                                      <Badge
                                        variant={providerMeta.variant}
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        {providerMeta.label}
                                      </Badge>
                                    </div>
                                    <span className="
                                      text-[11px] text-muted-foreground
                                    "
                                    >
                                      {t('findAccount.createdAt')}
                                      :
                                      {' '}
                                      {formatDateTime(account.createdAt)}
                                    </span>
                                  </div>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="
                                      size-8 text-muted-foreground
                                      hover:text-foreground
                                    "
                                    onClick={() => handleCopy(account.maskedEmail)}
                                    title={t('findAccount.copyEmail')}
                                  >
                                    {copiedEmail === account.maskedEmail
                                      ? (
                                        <Check className="
                                          size-4 text-emerald-500
                                        "
                                        />
                                      )
                                      : (
                                        <Copy className="size-4" />
                                      )}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid gap-2 pt-2">
                          <Button
                            type="button"
                            render={<Link to="/login" />}
                            className="w-full"
                          >
                            <span>{t('findAccount.goToLogin')}</span>
                            <ArrowRight className="size-4 ml-1.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFoundAccounts(null);
                              idForm.reset();
                            }}
                            className="w-full text-xs text-muted-foreground"
                          >
                            <RefreshCw className="size-3.5 mr-1" />
                            <span>{t('findAccount.searchAgain')}</span>
                          </Button>
                        </div>
                      </div>
                    )
                    : (
                      <idForm.AppForm>
                        <FormLayout
                          id="find-id-form"
                          onSubmit={() => void idForm.handleSubmit()}
                          className="grid gap-3"
                        >
                          <p className="text-xs text-muted-foreground mb-1">
                            {t('findAccount.description')}
                          </p>

                          <idForm.AppField name="name">
                            {(field) => (
                              <field.Input
                                type="text"
                                label={t('findAccount.nameLabel')}
                                placeholder={t('findAccount.namePlaceholder')}
                                autoComplete="name"
                                leftSide={(
                                  <User className="
                                    size-4 text-muted-foreground shrink-0
                                  "
                                  />
                                )}
                                required
                              />
                            )}
                          </idForm.AppField>

                          <idForm.AppField name="phoneNumber">
                            {(field) => (
                              <field.Input
                                type="tel"
                                label={t('findAccount.phoneLabel')}
                                placeholder={t('findAccount.phonePlaceholder')}
                                autoComplete="tel"
                                leftSide={(
                                  <Phone className="
                                    size-4 text-muted-foreground shrink-0
                                  "
                                  />
                                )}
                              />
                            )}
                          </idForm.AppField>

                          <idForm.Subscribe selector={(state) => state.isSubmitting}>
                            {(isSubmitting) => (
                              <Button
                                type="submit"
                                form="find-id-form"
                                disabled={isSubmitting}
                                className="w-full mt-1"
                              >
                                <span>{isSubmitting ? t('findAccount.searching') : t('findAccount.submitFindId')}</span>
                                <ArrowRight className="size-4 shrink-0 ml-1.5" />
                              </Button>
                            )}
                          </idForm.Subscribe>
                        </FormLayout>
                      </idForm.AppForm>
                    )}
                </TabsContent>

                {/* 2. 비밀번호 찾기 탭 */}
                <TabsContent
                  value="password"
                  className="
                    mt-4 min-h-[230px] flex flex-col justify-between
                    outline-none
                  "
                >
                  {resetSentInfo
                    ? (
                      <div className="
                        flex flex-col justify-between h-full py-1 text-center
                      "
                      >
                        <div className="my-auto grid gap-3 py-2">
                          {resetSentInfo.isOAuthUser
                            ? (
                              <>
                                <div className="
                                  mx-auto flex size-12 items-center
                                  justify-center rounded-full bg-amber-500/10
                                  text-amber-500
                                "
                                >
                                  <AlertCircle className="size-6" />
                                </div>
                                <div className="grid gap-1">
                                  <h3 className="
                                    text-sm font-semibold text-foreground
                                  "
                                  >
                                    {t('findAccount.oauthUserTitle')}
                                  </h3>
                                  <p className="
                                    text-xs/relaxed text-muted-foreground
                                    whitespace-pre-line
                                  "
                                  >
                                    {t('findAccount.oauthUserDesc', {
                                      provider: resetSentInfo.oauthProvider?.toUpperCase(),
                                    })}
                                  </p>
                                </div>
                              </>
                            )
                            : (
                              <>
                                <div className="
                                  mx-auto flex size-12 items-center
                                  justify-center rounded-full bg-primary/10
                                  text-primary
                                "
                                >
                                  <CheckCircle2 className="size-6" />
                                </div>
                                <div className="grid gap-1">
                                  <h3 className="
                                    text-sm font-semibold text-foreground
                                  "
                                  >
                                    {t('findAccount.emailSentTitle')}
                                  </h3>
                                  <p className="
                                    text-xs/relaxed text-muted-foreground
                                    whitespace-pre-line
                                  "
                                  >
                                    {t('findAccount.emailSentDesc', {
                                      email: resetSentInfo.email,
                                    })}
                                  </p>
                                </div>

                                {resetSentInfo.devMagicLink && (
                                  <Alert className="
                                    text-left bg-primary/5 border-primary/20
                                    mt-1
                                  "
                                  >
                                    <KeyRound className="size-4 text-primary" />
                                    <AlertTitle className="
                                      text-xs font-semibold text-primary
                                    "
                                    >
                                      {t('findAccount.devTestTitle')}
                                    </AlertTitle>
                                    <AlertDescription className="
                                      text-xs text-muted-foreground mt-1
                                    "
                                    >
                                      {t('findAccount.devTestDesc')}
                                      <div className="mt-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={() => window.open(resetSentInfo.devMagicLink, '_self')}
                                        >
                                          <span>{t('findAccount.openDevLink')}</span>
                                          <ExternalLink className="size-3 ml-1" />
                                        </Button>
                                      </div>
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </>
                            )}
                        </div>

                        <div className="grid gap-2 pt-1">
                          <Button
                            type="button"
                            render={<Link to="/login" />}
                            className="w-full"
                          >
                            <span>{t('findAccount.goToLogin')}</span>
                            <ArrowRight className="size-4 ml-1.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResetSentInfo(null);
                              passwordForm.reset();
                            }}
                            className="w-full text-xs text-muted-foreground"
                          >
                            <RefreshCw className="size-3.5 mr-1" />
                            <span>{t('findAccount.requestAgain')}</span>
                          </Button>
                        </div>
                      </div>
                    )
                    : (
                      <passwordForm.AppForm>
                        <FormLayout
                          id="find-password-form"
                          onSubmit={() => void passwordForm.handleSubmit()}
                          className="grid gap-3"
                        >
                          <p className="text-xs text-muted-foreground mb-1">
                            {t('findAccount.resetDescription')}
                          </p>

                          <passwordForm.AppField name="email">
                            {(field) => (
                              <field.Input
                                type="email"
                                label={t('findAccount.emailLabel')}
                                placeholder={t('findAccount.emailPlaceholder')}
                                autoComplete="email"
                                leftSide={(
                                  <Mail className="
                                    size-4 text-muted-foreground shrink-0
                                  "
                                  />
                                )}
                                required
                              />
                            )}
                          </passwordForm.AppField>

                          <passwordForm.Subscribe selector={(state) => state.isSubmitting}>
                            {(isSubmitting) => (
                              <Button
                                type="submit"
                                form="find-password-form"
                                disabled={isSubmitting}
                                className="w-full mt-1"
                              >
                                <span>{isSubmitting ? t('findAccount.sending') : t('findAccount.submitReset')}</span>
                                <ArrowRight className="size-4 shrink-0 ml-1.5" />
                              </Button>
                            )}
                          </passwordForm.Subscribe>
                        </FormLayout>
                      </passwordForm.AppForm>
                    )}
                </TabsContent>
              </Tabs>
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
            {t('findAccount.backToLogin')}
          </Link>
        </div>
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}
