import { z } from '@pkg/shared/common';
import { useI18n } from '@pkg/web-core/context';
import { useHashTab } from '@pkg/web-core/hooks';
import { FormLayout, FormSubmit, ScreenLayout, useAppForm } from '@pkg/web-core/ui';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Check, CheckCircle2, Copy, Mail, Phone, RefreshCw, Search, Sparkles, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuthControllerFindIdV1, useAuthControllerRequestPasswordResetV1 } from '~/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent, Tabs, TabsList, TabsTrigger } from '~/.generated/shadcn/components/ui';

type FindAccountTab = 'id' | 'password';
type FoundAccount = { maskedEmail: string, provider: string };
const FIND_ACCOUNT_TABS: readonly FindAccountTab[] = ['id', 'password'];

export const Route = createFileRoute('/_public/_global/find-account')({ component: FindAccountPage });

function FindAccountPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useHashTab(FIND_ACCOUNT_TABS, 'id');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const findIdMutation = useAuthControllerFindIdV1();
  const resetMutation = useAuthControllerRequestPasswordResetV1();

  const foundAccounts = findIdMutation.data?.items.filter(isFoundAccount);

  const idForm = useAppForm({
    defaultValues: { name: '', phoneNumber: '' },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, t('app.auth.findAccount.nameRequired')),
        phoneNumber: z.string().min(1, t('app.auth.findAccount.phoneRequired')),
      }),
    },
    onSubmit: async ({ value }) => {
      await findIdMutation.mutateAsync({
        data: {
          name: value.name.trim(),
          phoneNumber: value.phoneNumber.trim(),
        },
      });
    },
  });

  const passwordForm = useAppForm({
    defaultValues: { email: '', phoneNumber: '' },
    validators: {
      onSubmit: z.object({
        email: z.email(t('app.auth.findAccount.emailInvalid')),
        phoneNumber: z.string().min(1, t('app.auth.findAccount.phoneRequired')),
      }),
    },
    onSubmit: async ({ value }) => {
      await resetMutation.mutateAsync({
        data: {
          email: value.email.trim().toLowerCase(),
          phoneNumber: value.phoneNumber.trim(),
        },
      });
    },
  });

  const handleCopy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      toast.success(t('app.auth.findAccount.copied'));
      setTimeout(() => setCopiedEmail(null), 2000);
    }
    catch {
      toast.error(t('app.auth.findAccount.copyFailed'));
    }
  };

  return (
    <ScreenLayout.Root>
      <ScreenLayout.Content size="md">
        <Card className="size-full shadow-xl">
          <CardContent className="grid size-full grid-rows-[1fr] p-6">
            <div className="grid grid-rows-[auto_auto_1fr] gap-6">
              <div className="grid justify-items-center gap-2 text-center">
                <div className="
                  flex size-12 items-center justify-center rounded-2xl
                  bg-primary text-primary-foreground shadow-md
                "
                >
                  <Search className="size-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">{t('app.auth.findAccount.title')}</h1>
              </div>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as FindAccountTab)}
                className="w-full"
              >
                <TabsList className="
                  grid h-auto w-full grid-cols-2 rounded-lg bg-muted p-1
                "
                >
                  <TabsTrigger value="id">
                    {t('app.auth.findAccount.idTab')}
                  </TabsTrigger>
                  <TabsTrigger value="password">
                    {t('app.auth.findAccount.passwordTab')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <main className="grid grid-rows-[minmax(0,1fr)_auto] gap-4">
                <div className="scroll-y">
                  {activeTab === 'id' && (
                    foundAccounts
                      ? (
                        <div className="grid grid-rows-[auto_1fr_auto] gap-4">
                          <div className="
                            flex items-center gap-2 rounded-lg bg-primary/10 p-3
                            text-xs text-primary
                          "
                          >
                            <Sparkles className="size-4 shrink-0" />
                            <span>{t('app.auth.findAccount.found')}</span>
                          </div>
                          <div className="grid gap-2 border-t pt-4">
                            {foundAccounts.map((account) => (
                              <div
                                key={`${account.maskedEmail}-${account.provider}`}
                                className="
                                  flex items-center justify-between rounded-lg
                                  border bg-card/60 p-3
                                "
                              >
                                <div className="grid gap-1">
                                  <span className="
                                    font-mono text-sm font-semibold
                                  "
                                  >
                                    {account.maskedEmail}
                                  </span>
                                  <span className="
                                    text-[11px] text-muted-foreground
                                  "
                                  >
                                    {account.provider === 'credential' ? t('app.auth.findAccount.emailAccount') : account.provider}
                                  </span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => void handleCopy(account.maskedEmail)} title={t('app.auth.findAccount.copy')}>
                                  {copiedEmail === account.maskedEmail
                                    ? (
                                      <Check className="size-4 text-emerald-500" />
                                    )
                                    : (
                                      <Copy className="size-4" />
                                    )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                      : (
                        <idForm.AppForm>
                          <FormLayout
                            id="find-id-form"
                            onSubmit={() => void idForm.handleSubmit()}
                            className="grid-rows-[auto_auto] gap-4"
                          >
                            <div className="grid gap-4">
                              <idForm.AppField name="name">
                                {(field) => (
                                  <field.Input
                                    label={t('app.auth.findAccount.name')}
                                    placeholder={t('app.auth.findAccount.namePlaceholder')}
                                    autoComplete="name"
                                    leftSide={(
                                      <User className="
                                        size-4 text-muted-foreground
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
                                    label={t('app.auth.findAccount.phone')}
                                    placeholder={t('app.auth.findAccount.phonePlaceholder')}
                                    autoComplete="tel"
                                    leftSide={(
                                      <Phone className="
                                        size-4 text-muted-foreground
                                      "
                                      />
                                    )}
                                    required
                                  />
                                )}
                              </idForm.AppField>
                            </div>
                          </FormLayout>
                        </idForm.AppForm>
                      )
                  )}

                  {activeTab === 'password' && (
                    resetMutation.isSuccess
                      ? (
                        <div className="
                          grid grid-rows-[auto_auto] gap-4 text-center
                        "
                        >
                          <div className="grid gap-4 py-2">
                            <div className="
                              mx-auto flex size-12 items-center justify-center
                              rounded-full bg-primary/10 text-primary
                            "
                            >
                              <CheckCircle2 className="size-6" />
                            </div>
                            <div className="grid gap-1">
                              <h3 className="text-sm font-semibold">{t('app.auth.findAccount.resetSent')}</h3>
                            </div>
                          </div>
                        </div>
                      )
                      : (
                        <passwordForm.AppForm>
                          <FormLayout
                            id="find-password-form"
                            onSubmit={() => void passwordForm.handleSubmit()}
                            className="grid-rows-[auto_auto] gap-4"
                          >
                            <div className="grid gap-4">
                              <passwordForm.AppField name="email">
                                {(field) => (
                                  <field.Input
                                    type="email"
                                    label={t('app.auth.findAccount.email')}
                                    placeholder={t('app.auth.findAccount.emailPlaceholder')}
                                    autoComplete="email"
                                    leftSide={(
                                      <Mail className="
                                        size-4 text-muted-foreground
                                      "
                                      />
                                    )}
                                    required
                                  />
                                )}
                              </passwordForm.AppField>
                              <passwordForm.AppField name="phoneNumber">
                                {(field) => (
                                  <field.Input
                                    type="tel"
                                    label={t('app.auth.findAccount.phone')}
                                    placeholder={t('app.auth.findAccount.phonePlaceholder')}
                                    autoComplete="tel"
                                    leftSide={(
                                      <Phone className="
                                        size-4 text-muted-foreground
                                      "
                                      />
                                    )}
                                    required
                                  />
                                )}
                              </passwordForm.AppField>
                            </div>
                          </FormLayout>
                        </passwordForm.AppForm>
                      )
                  )}
                </div>
                <div className="grid gap-2 border-t pt-4">
                  {activeTab === 'id' && (
                    foundAccounts
                      ? (
                        <>
                          <Button
                            type="button"
                            nativeButton={false}
                            render={<Link to="/login" />}
                            className="w-full"
                          >
                            {t('app.auth.findAccount.goLogin')}
                            <ArrowRight className="ml-1.5 size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              findIdMutation.reset();
                              idForm.reset();
                            }}
                            className="w-full text-xs text-muted-foreground"
                          >
                            <RefreshCw className="mr-1 size-3.5" />
                            {t('app.auth.findAccount.findAgain')}
                          </Button>
                        </>
                      )
                      : (
                        <idForm.AppForm>
                          <idForm.Subscribe selector={(state) => state.isSubmitting}>
                            {(isSubmitting) => (
                              <FormSubmit
                                type="submit"
                                form="find-id-form"
                                disabled={isSubmitting || findIdMutation.isPending}
                                className="w-full"
                              >
                                {isSubmitting ? t('app.auth.findAccount.searching') : t('app.auth.findAccount.findId')}
                                <ArrowRight className="ml-1.5 size-4" />
                              </FormSubmit>
                            )}
                          </idForm.Subscribe>
                        </idForm.AppForm>
                      )
                  )}
                  {activeTab === 'password' && (
                    resetMutation.isSuccess
                      ? (
                        <>
                          <Button
                            type="button"
                            nativeButton={false}
                            render={<Link to="/login" />}
                            className="w-full"
                          >
                            {t('app.auth.findAccount.goLogin')}
                            <ArrowRight className="ml-1.5 size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              resetMutation.reset();
                              passwordForm.reset();
                            }}
                            className="w-full text-xs text-muted-foreground"
                          >
                            <RefreshCw className="mr-1 size-3.5" />
                            {t('app.auth.findAccount.requestAgain')}
                          </Button>
                        </>
                      )
                      : (
                        <passwordForm.AppForm>
                          <passwordForm.Subscribe selector={(state) => state.isSubmitting}>
                            {(isSubmitting) => (
                              <FormSubmit
                                type="submit"
                                form="find-password-form"
                                disabled={isSubmitting || resetMutation.isPending}
                                className="w-full"
                              >
                                {isSubmitting ? t('app.auth.findAccount.sending') : t('app.auth.findAccount.requestReset')}
                                <ArrowRight className="ml-1.5 size-4" />
                              </FormSubmit>
                            )}
                          </passwordForm.Subscribe>
                        </passwordForm.AppForm>
                      )
                  )}
                </div>
              </main>
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
          {t('app.auth.findAccount.back')}
        </Link>
      </ScreenLayout.Addon>
    </ScreenLayout.Root>
  );
}

function isFoundAccount(value: unknown): value is FoundAccount {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.maskedEmail === 'string' && typeof record.provider === 'string';
}
