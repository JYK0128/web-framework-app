import { Check, Copy } from 'lucide-react';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { toast } from 'sonner';

import type { OAuthConfigDto } from '#/.generated/api/model';
import { Badge, Button, Switch } from '#/.generated/shadcn/components/ui';
import { FormInput, FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export interface OAuthTabHandle {
  submitData: () => Promise<OAuthConfigDto | null>
}

export interface OAuthTabProps {
  oauth?: Partial<OAuthConfigDto>
}

function getBadgeVariant(isEnabled: boolean, isConfigured: boolean) {
  if (!isEnabled) return 'outline' as const;
  return isConfigured ? ('default' as const) : ('secondary' as const);
}

function getBadgeLabel(t: (key: string) => string, isEnabled: boolean, isConfigured: boolean): string {
  if (!isEnabled) return t('systemManagement.oauth.disabled');
  if (isConfigured) return t('systemManagement.oauth.statusConfigured');
  return t('systemManagement.oauth.statusIncomplete');
}

export const OAuthTab = forwardRef<OAuthTabHandle, OAuthTabProps>(function OAuthTab(
  { oauth }: OAuthTabProps,
  ref,
) {
  const { t } = useI18n();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const oauthForm = useAppForm({
    defaultValues: {
      google: {
        enabled: oauth?.google?.enabled ?? false,
        clientId: oauth?.google?.clientId ?? '',
        clientSecret: '',
        scope: oauth?.google?.scope ?? '',
      },
      kakao: {
        enabled: oauth?.kakao?.enabled ?? false,
        clientId: oauth?.kakao?.clientId ?? '',
        clientSecret: '',
        scope: oauth?.kakao?.scope ?? '',
      },
      naver: {
        enabled: oauth?.naver?.enabled ?? false,
        clientId: oauth?.naver?.clientId ?? '',
        clientSecret: '',
        scope: oauth?.naver?.scope ?? '',
      },
      github: {
        enabled: oauth?.github?.enabled ?? false,
        clientId: oauth?.github?.clientId ?? '',
        clientSecret: '',
        scope: oauth?.github?.scope ?? '',
      },
    },
  });

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      const isValid = await oauthForm.validateAllFields('submit');
      if (!isValid) {
        return null;
      }
      return oauthForm.state.values;
    },
  }));

  const copyCallbackUrl = (provider: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const callbackUrl = `${origin}/api/v1/auth/oauth/${provider}/callback`;

    navigator.clipboard.writeText(callbackUrl).then(() => {
      setCopiedKey(provider);
      toast.success(t('systemManagement.oauth.copied'));
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => {});
  };

  return (
    <oauthForm.AppForm>
      <FormLayout
        id="oauth-form"
        onSubmit={() => void oauthForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        <div className="
          grid grid-cols-1
          md:grid-cols-2
          gap-6
        "
        >
          {/* 1. Google OAuth */}
          <oauthForm.Subscribe
            selector={(state) => [
              state.values.google.enabled,
              state.values.google.clientId,
            ]}
          >
            {([isEnabled, clientId]) => {
              const isConfigured = Boolean(clientId);
              const badgeVariant = getBadgeVariant(Boolean(isEnabled), isConfigured);
              const badgeLabel = getBadgeLabel(t, Boolean(isEnabled), isConfigured);

              return (
                <SectionCard
                  icon="key-round"
                  title={t('systemManagement.oauth.providers.google.name')}
                  description={t('systemManagement.oauth.providers.google.description')}
                >
                  <SectionCard.Actions>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={badgeVariant}
                        className="text-xs px-2 py-0.5"
                      >
                        {badgeLabel}
                      </Badge>
                      <oauthForm.AppField name="google.enabled">
                        {(field) => (
                          <Switch
                            checked={field.state.value}
                            onCheckedChange={(val) => field.handleChange(val)}
                            aria-label={t('systemManagement.oauth.providers.google.name')}
                          />
                        )}
                      </oauthForm.AppField>
                    </div>
                  </SectionCard.Actions>

                  <SectionCard.Content className="space-y-4 pt-2">
                    <FormInput
                      name="google.clientId"
                      label={t('systemManagement.oauth.clientId')}
                      placeholder="Google OAuth Client ID"
                    />
                    <FormInput
                      name="google.clientSecret"
                      type="password"
                      label={t('systemManagement.oauth.clientSecret')}
                      placeholder={
                        oauth?.google?.clientId
                          ? t('systemManagement.oauth.clientSecretPlaceholder')
                          : t('systemManagement.oauth.clientSecretEmptyPlaceholder')
                      }
                    />
                    <FormInput
                      name="google.scope"
                      label={t('systemManagement.oauth.scope')}
                      placeholder="email profile openid"
                    />

                    <div className="
                      rounded-lg border bg-muted/40 p-3 space-y-1.5
                    "
                    >
                      <div className="
                        flex items-center justify-between text-xs
                        text-muted-foreground
                      "
                      >
                        <span>{t('systemManagement.oauth.callbackUrlGuide')}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCallbackUrl('google')}
                          className="
                            h-6 px-2 text-xs flex items-center gap-1
                            cursor-pointer
                          "
                        >
                          {copiedKey === 'google'
                            ? (
                              <>
                                <Check className="size-3 text-emerald-500" />
                                <span className="text-emerald-500">{t('systemManagement.oauth.copied')}</span>
                              </>
                            )
                            : (
                              <>
                                <Copy className="size-3" />
                                <span>{t('systemManagement.oauth.copyCallbackUrl')}</span>
                              </>
                            )}
                        </Button>
                      </div>
                      <code className="
                        text-xs font-mono break-all text-foreground/80 block
                      "
                      >
                        {typeof window !== 'undefined' ? window.location.origin : ''}
                        /api/v1/auth/oauth/google/callback
                      </code>
                    </div>
                  </SectionCard.Content>
                </SectionCard>
              );
            }}
          </oauthForm.Subscribe>

          {/* 2. Kakao OAuth */}
          <oauthForm.Subscribe
            selector={(state) => [
              state.values.kakao.enabled,
              state.values.kakao.clientId,
            ]}
          >
            {([isEnabled, clientId]) => {
              const isConfigured = Boolean(clientId);
              const badgeVariant = getBadgeVariant(Boolean(isEnabled), isConfigured);
              const badgeLabel = getBadgeLabel(t, Boolean(isEnabled), isConfigured);

              return (
                <SectionCard
                  icon="key-round"
                  title={t('systemManagement.oauth.providers.kakao.name')}
                  description={t('systemManagement.oauth.providers.kakao.description')}
                >
                  <SectionCard.Actions>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={badgeVariant}
                        className="text-xs px-2 py-0.5"
                      >
                        {badgeLabel}
                      </Badge>
                      <oauthForm.AppField name="kakao.enabled">
                        {(field) => (
                          <Switch
                            checked={field.state.value}
                            onCheckedChange={(val) => field.handleChange(val)}
                            aria-label={t('systemManagement.oauth.providers.kakao.name')}
                          />
                        )}
                      </oauthForm.AppField>
                    </div>
                  </SectionCard.Actions>

                  <SectionCard.Content className="space-y-4 pt-2">
                    <FormInput
                      name="kakao.clientId"
                      label={t('systemManagement.oauth.clientId')}
                      placeholder="REST API Key"
                    />
                    <FormInput
                      name="kakao.clientSecret"
                      type="password"
                      label={t('systemManagement.oauth.clientSecret')}
                      placeholder={
                        oauth?.kakao?.clientId
                          ? t('systemManagement.oauth.clientSecretPlaceholder')
                          : t('systemManagement.oauth.clientSecretEmptyPlaceholder')
                      }
                    />
                    <FormInput
                      name="kakao.scope"
                      label={t('systemManagement.oauth.scope')}
                      placeholder="profile_nickname account_email"
                    />

                    <div className="
                      rounded-lg border bg-muted/40 p-3 space-y-1.5
                    "
                    >
                      <div className="
                        flex items-center justify-between text-xs
                        text-muted-foreground
                      "
                      >
                        <span>{t('systemManagement.oauth.callbackUrlGuide')}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCallbackUrl('kakao')}
                          className="
                            h-6 px-2 text-xs flex items-center gap-1
                            cursor-pointer
                          "
                        >
                          {copiedKey === 'kakao'
                            ? (
                              <>
                                <Check className="size-3 text-emerald-500" />
                                <span className="text-emerald-500">{t('systemManagement.oauth.copied')}</span>
                              </>
                            )
                            : (
                              <>
                                <Copy className="size-3" />
                                <span>{t('systemManagement.oauth.copyCallbackUrl')}</span>
                              </>
                            )}
                        </Button>
                      </div>
                      <code className="
                        text-xs font-mono break-all text-foreground/80 block
                      "
                      >
                        {typeof window !== 'undefined' ? window.location.origin : ''}
                        /api/v1/auth/oauth/kakao/callback
                      </code>
                    </div>
                  </SectionCard.Content>
                </SectionCard>
              );
            }}
          </oauthForm.Subscribe>

          {/* 3. Naver OAuth */}
          <oauthForm.Subscribe
            selector={(state) => [
              state.values.naver.enabled,
              state.values.naver.clientId,
            ]}
          >
            {([isEnabled, clientId]) => {
              const isConfigured = Boolean(clientId);
              const badgeVariant = getBadgeVariant(Boolean(isEnabled), isConfigured);
              const badgeLabel = getBadgeLabel(t, Boolean(isEnabled), isConfigured);

              return (
                <SectionCard
                  icon="key-round"
                  title={t('systemManagement.oauth.providers.naver.name')}
                  description={t('systemManagement.oauth.providers.naver.description')}
                >
                  <SectionCard.Actions>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={badgeVariant}
                        className="text-xs px-2 py-0.5"
                      >
                        {badgeLabel}
                      </Badge>
                      <oauthForm.AppField name="naver.enabled">
                        {(field) => (
                          <Switch
                            checked={field.state.value}
                            onCheckedChange={(val) => field.handleChange(val)}
                            aria-label={t('systemManagement.oauth.providers.naver.name')}
                          />
                        )}
                      </oauthForm.AppField>
                    </div>
                  </SectionCard.Actions>

                  <SectionCard.Content className="space-y-4 pt-2">
                    <FormInput
                      name="naver.clientId"
                      label={t('systemManagement.oauth.clientId')}
                      placeholder="Naver Client ID"
                    />
                    <FormInput
                      name="naver.clientSecret"
                      type="password"
                      label={t('systemManagement.oauth.clientSecret')}
                      placeholder={
                        oauth?.naver?.clientId
                          ? t('systemManagement.oauth.clientSecretPlaceholder')
                          : t('systemManagement.oauth.clientSecretEmptyPlaceholder')
                      }
                    />
                    <FormInput
                      name="naver.scope"
                      label={t('systemManagement.oauth.scope')}
                      placeholder="name email profile_image"
                    />

                    <div className="
                      rounded-lg border bg-muted/40 p-3 space-y-1.5
                    "
                    >
                      <div className="
                        flex items-center justify-between text-xs
                        text-muted-foreground
                      "
                      >
                        <span>{t('systemManagement.oauth.callbackUrlGuide')}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCallbackUrl('naver')}
                          className="
                            h-6 px-2 text-xs flex items-center gap-1
                            cursor-pointer
                          "
                        >
                          {copiedKey === 'naver'
                            ? (
                              <>
                                <Check className="size-3 text-emerald-500" />
                                <span className="text-emerald-500">{t('systemManagement.oauth.copied')}</span>
                              </>
                            )
                            : (
                              <>
                                <Copy className="size-3" />
                                <span>{t('systemManagement.oauth.copyCallbackUrl')}</span>
                              </>
                            )}
                        </Button>
                      </div>
                      <code className="
                        text-xs font-mono break-all text-foreground/80 block
                      "
                      >
                        {typeof window !== 'undefined' ? window.location.origin : ''}
                        /api/v1/auth/oauth/naver/callback
                      </code>
                    </div>
                  </SectionCard.Content>
                </SectionCard>
              );
            }}
          </oauthForm.Subscribe>

          {/* 4. GitHub OAuth */}
          <oauthForm.Subscribe
            selector={(state) => [
              state.values.github.enabled,
              state.values.github.clientId,
            ]}
          >
            {([isEnabled, clientId]) => {
              const isConfigured = Boolean(clientId);
              const badgeVariant = getBadgeVariant(Boolean(isEnabled), isConfigured);
              const badgeLabel = getBadgeLabel(t, Boolean(isEnabled), isConfigured);

              return (
                <SectionCard
                  icon="key-round"
                  title={t('systemManagement.oauth.providers.github.name')}
                  description={t('systemManagement.oauth.providers.github.description')}
                >
                  <SectionCard.Actions>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={badgeVariant}
                        className="text-xs px-2 py-0.5"
                      >
                        {badgeLabel}
                      </Badge>
                      <oauthForm.AppField name="github.enabled">
                        {(field) => (
                          <Switch
                            checked={field.state.value}
                            onCheckedChange={(val) => field.handleChange(val)}
                            aria-label={t('systemManagement.oauth.providers.github.name')}
                          />
                        )}
                      </oauthForm.AppField>
                    </div>
                  </SectionCard.Actions>

                  <SectionCard.Content className="space-y-4 pt-2">
                    <FormInput
                      name="github.clientId"
                      label={t('systemManagement.oauth.clientId')}
                      placeholder="GitHub Client ID"
                    />
                    <FormInput
                      name="github.clientSecret"
                      type="password"
                      label={t('systemManagement.oauth.clientSecret')}
                      placeholder={
                        oauth?.github?.clientId
                          ? t('systemManagement.oauth.clientSecretPlaceholder')
                          : t('systemManagement.oauth.clientSecretEmptyPlaceholder')
                      }
                    />
                    <FormInput
                      name="github.scope"
                      label={t('systemManagement.oauth.scope')}
                      placeholder="read:user user:email"
                    />

                    <div className="
                      rounded-lg border bg-muted/40 p-3 space-y-1.5
                    "
                    >
                      <div className="
                        flex items-center justify-between text-xs
                        text-muted-foreground
                      "
                      >
                        <span>{t('systemManagement.oauth.callbackUrlGuide')}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCallbackUrl('github')}
                          className="
                            h-6 px-2 text-xs flex items-center gap-1
                            cursor-pointer
                          "
                        >
                          {copiedKey === 'github'
                            ? (
                              <>
                                <Check className="size-3 text-emerald-500" />
                                <span className="text-emerald-500">{t('systemManagement.oauth.copied')}</span>
                              </>
                            )
                            : (
                              <>
                                <Copy className="size-3" />
                                <span>{t('systemManagement.oauth.copyCallbackUrl')}</span>
                              </>
                            )}
                        </Button>
                      </div>
                      <code className="
                        text-xs font-mono break-all text-foreground/80 block
                      "
                      >
                        {typeof window !== 'undefined' ? window.location.origin : ''}
                        /api/v1/auth/oauth/github/callback
                      </code>
                    </div>
                  </SectionCard.Content>
                </SectionCard>
              );
            }}
          </oauthForm.Subscribe>
        </div>
      </FormLayout>
    </oauthForm.AppForm>
  );
});
