import { Check, Copy, Globe, ListChecks, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Input, Switch } from '#/.generated/shadcn/components/ui';
import { OAuthProviderIcon } from '#/components/app';
import { SectionCard } from '#/components/layout';
import { AUTH_OAUTH_PATH } from '#/configs/app.config';
import { useI18n } from '#/hooks';

import type { OAuthProviderMeta } from './oauth-provider.types';
import type { OAuthFormInstance } from './oauth-tab';

interface OAuthProviderDetailProps {
  meta: OAuthProviderMeta
  form: OAuthFormInstance
  onRemove?: () => void
}

export function OAuthProviderDetail({
  meta,
  form,
  onRemove,
}: OAuthProviderDetailProps) {
  const { t } = useI18n();
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const providerKey = meta.id;
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const callbackUrl = `${originUrl}${AUTH_OAUTH_PATH}/${providerKey}/callback`;

  const copyCallbackUrl = () => {
    navigator.clipboard
      .writeText(callbackUrl)
      .then(() => {
        setCopiedCallback(true);
        toast.success(t('systemManagement.oauth.copied'));
        setTimeout(() => setCopiedCallback(false), 2000);
      })
      .catch(() => {});
  };

  const copyOriginUrl = () => {
    navigator.clipboard
      .writeText(originUrl)
      .then(() => {
        setCopiedOrigin(true);
        toast.success(t('systemManagement.oauth.copied'));
        setTimeout(() => setCopiedOrigin(false), 2000);
      })
      .catch(() => {});
  };

  const getProviderChecklist = (id: string) => {
    switch (id) {
      case 'kakao':
        return [
          {
            label: '사이트 도메인(Web Origin) 등록',
            desc: '앱 설정 > 플랫폼 > Web > 사이트 도메인에 아래 도메인 주소 등록 (미등록 시 KOE006 에러 발생)',
          },
          {
            label: '카카오 로그인 활성화 상태 ON',
            desc: '제품 설정 > 카카오 로그인 메뉴에서 활성화 상태를 반드시 ON으로 설정',
          },
          {
            label: 'Client Secret 발급 및 활성화 상태(사용함)',
            desc: '카카오 로그인 > 보안 메뉴에서 Client Secret 발급 후 상태를 \'사용함\'으로 설정',
          },
          {
            label: '동의항목 설정',
            desc: '카카오 로그인 > 동의항목에서 닉네임 및 카카오계정(이메일) 권한을 동의 항목으로 설정',
          },
        ];
      case 'naver':
        return [
          {
            label: '서비스 URL 등록',
            desc: 'Application > API 설정 > 서비스 URL에 아래 도메인 주소 등록',
          },
          {
            label: 'Callback URL 등록',
            desc: 'API 설정 > Callback URL에 아래 리다이렉트 URI 등록',
          },
          {
            label: '사용 API 및 제공 정보 선택',
            desc: '네아로(네이버 아이디로 로그인)에서 이름, 이메일, 프로필 사진 권한 체크',
          },
        ];
      case 'google':
        return [
          {
            label: '승인된 자바스크립트 원본 등록',
            desc: '사용자 인증 정보 > OAuth 클라이언트 ID에서 웹 사이트 주소(Origin) 등록',
          },
          {
            label: '승인된 리디렉션 URI 등록',
            desc: 'OAuth 클라이언트 ID의 승인된 리디렉션 URI에 아래 Callback URL 등록',
          },
          {
            label: 'OAuth 동의 화면 구성',
            desc: '앱 이름, 지원 이메일 등 기본 정보 입력 및 테스트 사용자 등록 (외부 앱 게시 전 필수)',
          },
        ];
      case 'github':
        return [
          {
            label: 'Homepage URL 등록',
            desc: 'Developer Settings > OAuth Apps에서 Homepage URL에 웹 사이트 주소(Origin) 등록',
          },
          {
            label: 'Authorization callback URL 등록',
            desc: 'Authorization callback URL에 아래 Callback URL 등록',
          },
          {
            label: 'Client Secret 발급',
            desc: 'Generate a new client secret으로 보안 비밀번호 생성 후 저장',
          },
        ];
      case 'apple':
        return [
          {
            label: 'Domains and Subdomains 등록',
            desc: 'Certificates, Identifiers & Profiles > Services IDs에서 웹 사이트 도메인 등록',
          },
          {
            label: 'Return URLs 등록',
            desc: 'Sign in with Apple 설정에서 아래 리다이렉트 URI 등록',
          },
          {
            label: 'Keys 생성 및 Key ID 확인',
            desc: 'Sign in with Apple 전용 개인키(.p8) 및 Key ID 발급',
          },
        ];
      default:
        return [
          {
            label: '사이트 도메인 / Web Origin 등록',
            desc: '해당 서비스 개발자 콘솔의 웹 사이트 또는 허용된 출처(Origin) 항목에 등록',
          },
          {
            label: '승인된 리디렉션 URI / Callback URL 등록',
            desc: 'OAuth 설정의 승인된 리디렉션 URI 항목에 아래 Callback URL 등록',
          },
          {
            label: '사용자 정보 요청 권한 (Scope) 설정',
            desc: '이메일, 프로필 정보(닉네임) 조회 권한 허용',
          },
        ];
    }
  };

  const translatedName = t(`systemManagement.oauth.providers.${meta.id}.name`, {
    defaultValue: meta.name,
  });

  return (
    <form.Subscribe
      selector={(state) => [
        state.values[providerKey]?.enabled,
        state.values[providerKey]?.clientId ?? '',
      ]}
    >
      {([isEnabled, clientId]) => {
        const isConfigured = Boolean(clientId);

        let badgeVariant: 'default' | 'secondary' | 'outline' = 'outline';
        let badgeLabel = t('systemManagement.oauth.disabled');

        if (isEnabled) {
          if (isConfigured) {
            badgeVariant = 'default';
            badgeLabel = t('systemManagement.oauth.statusConfigured');
          }
          else {
            badgeVariant = 'secondary';
            badgeLabel = t('systemManagement.oauth.statusIncomplete');
          }
        }

        return (
          <div className="
            min-h-[400px]
            lg:min-h-0 lg:h-full
          "
          >
            <SectionCard
              textSize="sm"
              icon="shield"
              title={`${translatedName} (${meta.id})`}
            >
              <SectionCard.Actions>
                <div className="flex items-center gap-2.5">
                  <Badge
                    variant={badgeVariant}
                    className="text-xs px-2.5 py-0.5"
                  >
                    {badgeLabel}
                  </Badge>

                  <div className="
                    flex items-center gap-2 pl-2 border-l border-border/60
                  "
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      연동 활성화
                    </span>
                    <form.AppField name={`${providerKey}.enabled`}>
                      {(field) => (
                        <Switch
                          checked={Boolean(field.state.value)}
                          onCheckedChange={(val) => field.handleChange(val)}
                          aria-label={`${translatedName} 활성화`}
                        />
                      )}
                    </form.AppField>
                  </div>

                  {onRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onRemove}
                      className="
                        size-8 text-muted-foreground
                        hover:text-destructive
                        cursor-pointer ml-1
                      "
                      title={t('systemManagement.oauth.removeProvider')}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </SectionCard.Actions>

              <SectionCard.Content className="
                scroll-y flex flex-col gap-6 p-6 pb-16
              "
              >
                {/* 1 & 2. 사이트 도메인 (Web Origin) & 승인된 리디렉션 URI (Callback URL) 행(Row) 배치 단일 카드 */}
                <div className="
                  rounded-xl border bg-card/60 p-4 shadow-2xs flex flex-col
                  gap-3.5 shrink-0
                "
                >
                  {/* 1. 사이트 도메인 / 웹 원본 (Web Origin) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="
                      flex items-center gap-1.5 text-xs font-semibold
                      text-foreground
                    "
                    >
                      <Globe className="size-3.5 text-primary" />
                      <span>{t('systemManagement.oauth.siteDomainGuide')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        readOnly
                        value={originUrl}
                        className="h-8 font-mono text-xs bg-muted/40 select-all"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copyOriginUrl}
                        className="size-8 shrink-0 cursor-pointer"
                        title={t('systemManagement.oauth.copySiteDomain')}
                      >
                        {copiedOrigin
                          ? (
                            <Check className="size-3.5 text-emerald-500" />
                          )
                          : (
                            <Copy className="size-3.5" />
                          )}
                      </Button>
                    </div>
                  </div>

                  {/* 2. 승인된 리디렉션 URI (Callback URL) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="
                      flex items-center gap-1.5 text-xs font-semibold
                      text-foreground
                    "
                    >
                      <Shield className="size-3.5 text-primary" />
                      <span>{t('systemManagement.oauth.callbackUrlGuide')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        readOnly
                        value={callbackUrl}
                        className="h-8 font-mono text-xs bg-muted/40 select-all"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copyCallbackUrl}
                        className="size-8 shrink-0 cursor-pointer"
                        title={t('systemManagement.oauth.copyCallbackUrl')}
                      >
                        {copiedCallback
                          ? (
                            <Check className="size-3.5 text-emerald-500" />
                          )
                          : (
                            <Copy className="size-3.5" />
                          )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 3. 입력 폼 필드 그리드 */}
                <div className="
                  grid grid-cols-1
                  md:grid-cols-2
                  gap-5 shrink-0
                "
                >
                  <form.AppField name={`${providerKey}.authorizeUrl`}>
                    {(field) => (
                      <field.Input
                        label="Authorize endpoint"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.tokenUrl`}>
                    {(field) => (
                      <field.Input
                        label="Token endpoint"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.userInfoUrl`}>
                    {(field) => (
                      <field.Input
                        label="User info endpoint"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.revokeUrl`}>
                    {(field) => (
                      <field.Input
                        label="Revoke endpoint"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.name`}>
                    {(field) => (
                      <field.Input
                        label={t('systemManagement.oauth.customName')}
                        placeholder={meta.name}
                        className="text-xs"
                      />
                    )}
                  </form.AppField>

                  <form.AppField name={`${providerKey}.scope`}>
                    {(field) => (
                      <field.Input
                        label={t('systemManagement.oauth.scope')}
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                </div>

                <div className="
                  grid grid-cols-1
                  md:grid-cols-2
                  gap-5 shrink-0
                "
                >
                  <form.AppField name={`${providerKey}.clientId`}>
                    {(field) => (
                      <field.Input
                        label={t('systemManagement.oauth.clientId')}
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>

                  <form.AppField name={`${providerKey}.clientSecret`}>
                    {(field) => (
                      <field.Input
                        type="password"
                        label={t('systemManagement.oauth.clientSecret')}
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                </div>

                <div className="
                  grid grid-cols-1
                  md:grid-cols-2
                  gap-5 shrink-0
                "
                >
                  <form.AppField name={`${providerKey}.iconFiles`}>
                    {(field) => (
                      <field.FileInput
                        label="프로바이더 아이콘"
                        accept="image/png,image/jpeg,image/webp"
                        uploadTiming="onSubmit"
                      />
                    )}
                  </form.AppField>

                  <form.AppField name={`${providerKey}.brandColor`}>
                    {(field) => (
                      <field.Input
                        type="color"
                        label="브랜딩 컬러"
                        className="h-9 w-16 cursor-pointer p-1"
                      />
                    )}
                  </form.AppField>

                  <form.Subscribe
                    selector={(state) => state.values[providerKey]?.iconUrl || meta.iconUrl || ''}
                  >
                    {(iconUrl) => (
                      <div className="
                        flex items-center gap-2 rounded-lg border bg-muted/40
                        p-3
                        md:col-span-2
                      "
                      >
                        <OAuthProviderIcon
                          iconUrl={iconUrl}
                          className="size-5 shrink-0"
                        />
                        <span className="text-xs text-muted-foreground">
                          로그인 버튼에는 현재 아이콘과 브랜딩 컬러가 적용됩니다.
                        </span>
                      </div>
                    )}
                  </form.Subscribe>
                </div>

                {/* 4. 가이드 (개발자 콘솔 필수 체크리스트 & 연동 유의사항) */}
                <div className="
                  rounded-xl border border-primary/20 bg-primary/5 p-4
                  shadow-2xs flex flex-col gap-3 shrink-0
                "
                >
                  <div className="
                    flex items-center gap-2 text-xs font-semibold
                    text-foreground
                  "
                  >
                    <ListChecks className="size-4 text-primary" />
                    <span>
                      {t('systemManagement.oauth.consoleChecklistTitle')}
                      {' '}
                      (
                      {translatedName}
                      )
                    </span>
                  </div>

                  <div className="
                    grid grid-cols-1
                    md:grid-cols-2
                    gap-2.5
                  "
                  >
                    {getProviderChecklist(meta.id).map((item, idx) => (
                      <div
                        key={idx}
                        className="
                          flex items-start gap-2.5 text-xs rounded-lg
                          bg-background/80 border border-border/50 p-2.5
                        "
                      >
                        <div className="
                          size-5 rounded-full bg-primary/10 text-primary flex
                          items-center justify-center shrink-0 mt-0.5
                          font-semibold text-[11px]
                        "
                        >
                          {idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground block">
                            {item.label}
                          </span>
                          <span className="
                            text-muted-foreground text-[11px] leading-relaxed
                          "
                          >
                            {item.desc}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </SectionCard.Content>
            </SectionCard>
          </div>
        );
      }}
    </form.Subscribe>
  );
}
