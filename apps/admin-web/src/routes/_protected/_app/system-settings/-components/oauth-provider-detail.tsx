import { Check, Copy, Globe, ListChecks, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Input, Switch } from '#/.generated/shadcn/components/ui';
import { OAuthProviderIcon } from '#/components/app';
import { SectionCard } from '#/components/layout';

import { hasOAuthProviderConnectionFields, type OAuthProviderMeta } from './oauth-provider.types';
import type { OAuthFormInstance } from './oauth-tab';

interface OAuthProviderDetailProps {
  meta: OAuthProviderMeta
  form: OAuthFormInstance
  siteOrigin: string
  onSiteOriginChange: (siteOrigin: string) => void
  onRemove?: () => void
}

export function OAuthProviderDetail({
  meta,
  form,
  siteOrigin,
  onSiteOriginChange,
  onRemove,
}: OAuthProviderDetailProps) {
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const providerKey = meta.id;
  let originUrl = '';
  try {
    const parsed = new URL(siteOrigin.trim());
    if (['http:', 'https:'].includes(parsed.protocol) && parsed.pathname === '/' && !parsed.search && !parsed.hash) originUrl = parsed.origin;
  }
  catch {
    originUrl = '';
  }
  const callbackUrl = originUrl ? `${originUrl}/api/v1/auth/oauth/${providerKey}/callback` : '';

  const copyCallbackUrl = () => {
    navigator.clipboard
      .writeText(callbackUrl)
      .then(() => {
        setCopiedCallback(true);
        toast.success('복사됨');
        setTimeout(() => setCopiedCallback(false), 2000);
      })
      .catch(() => {});
  };

  const copyOriginUrl = () => {
    navigator.clipboard
      .writeText(originUrl)
      .then(() => {
        setCopiedOrigin(true);
        toast.success('복사됨');
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

  const translatedName = meta.name;

  return (
    <form.Subscribe
      selector={(state) => ({
        enabled: state.values[providerKey]?.enabled,
        clientId: state.values[providerKey]?.clientId ?? '',
        authorizeUrl: state.values[providerKey]?.authorizeUrl ?? '',
        tokenUrl: state.values[providerKey]?.tokenUrl ?? '',
        userInfoUrl: state.values[providerKey]?.userInfoUrl ?? '',
        idTokenOnly: state.values[providerKey]?.idTokenOnly ?? false,
        jwksUrl: state.values[providerKey]?.jwksUrl ?? '',
        issuer: state.values[providerKey]?.issuer ?? '',
      })}
    >
      {({ enabled: isEnabled, clientId, authorizeUrl, tokenUrl, userInfoUrl, idTokenOnly, jwksUrl, issuer }) => {
        const isConfigured = hasOAuthProviderConnectionFields({ clientId, authorizeUrl, tokenUrl, userInfoUrl, idTokenOnly, jwksUrl, issuer });

        let badgeVariant: 'default' | 'secondary' | 'outline' = 'outline';
        let badgeLabel = '비활성화';

        if (isEnabled) {
          if (isConfigured) {
            badgeVariant = 'default';
            badgeLabel = '연동 정보 입력됨';
          }
          else {
            badgeVariant = 'secondary';
            badgeLabel = '설정 필요';
          }
        }

        return (
          <div className="
            min-h-[400px]
            lg:min-h-0 lg:h-full
          "
          >
            <SectionCard
              className="lg:h-full lg:overflow-hidden"
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
                      title="서비스 제거"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </SectionCard.Actions>

              <SectionCard.Content className="
                lg:scroll-y
                flex flex-col gap-6 p-6 pb-16
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
                      <span>서비스 웹사이트 주소 (Web Origin)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={siteOrigin}
                        onChange={(event) => onSiteOriginChange(event.target.value)}
                        placeholder="https://service.example.com"
                        aria-label="서비스 웹사이트 주소"
                        aria-invalid={Boolean(siteOrigin.trim()) && !originUrl}
                        className="
                          h-8 font-mono text-xs bg-background select-all
                        "
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copyOriginUrl}
                        disabled={!originUrl}
                        className="size-8 shrink-0 cursor-pointer"
                        title="도메인 복사"
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
                    <p className="text-xs text-muted-foreground">
                      이 주소를 기준으로 아래 OAuth 콜백 주소를 만듭니다. 입력한 주소는 저장되지 않습니다.
                    </p>
                  </div>

                  {/* 2. 승인된 리디렉션 URI (Callback URL) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="
                      flex items-center gap-1.5 text-xs font-semibold
                      text-foreground
                    "
                    >
                      <Shield className="size-3.5 text-primary" />
                      <span>리다이렉트 URL (개발자 콘솔 등록용)</span>
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
                        disabled={!callbackUrl}
                        className="size-8 shrink-0 cursor-pointer"
                        title="리다이렉트 URL 복사"
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
                    {!siteOrigin.trim()
                      ? <p className="text-xs text-muted-foreground">서비스 웹사이트 주소를 입력하면 리다이렉트 URL이 표시됩니다.</p>
                      : !originUrl && <p className="text-xs text-destructive">http:// 또는 https://로 시작하는 웹사이트 주소를 입력해 주세요. 경로는 입력하지 마세요.</p>}
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
                        placeholder="https://example.com/oauth/authorize"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.tokenUrl`}>
                    {(field) => (
                      <field.Input
                        label="Token endpoint"
                        placeholder="https://example.com/oauth/token"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.tokenAuthMethod`}>
                    {(field) => <field.Select label="토큰 endpoint 인증 방식" options={[{ label: '요청 본문 (client_secret_post)', value: 'client_secret_post' }, { label: 'HTTP Basic (client_secret_basic)', value: 'client_secret_basic' }]} />}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.userInfoUrl`}>
                    {(field) => (
                      <field.Input
                        label="User info endpoint"
                        placeholder="https://example.com/userinfo"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.idTokenOnly`}>
                    {(field) => <field.Checkbox label="UserInfo 대신 OIDC ID Token 사용" />}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.jwksUrl`}>
                    {(field) => (
                      <field.Input
                        label="OIDC JWKS URL"
                        placeholder="https://provider.example/.well-known/jwks.json"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.issuer`}>
                    {(field) => (
                      <field.Input
                        label="OIDC issuer"
                        placeholder="https://provider.example"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.userIdPath`}>
                    {(field) => (
                      <field.Input
                        label="사용자 ID 경로"
                        placeholder="sub 또는 response.id"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.emailPath`}>
                    {(field) => (
                      <field.Input
                        label="이메일 경로"
                        placeholder="email 또는 response.email"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.namePath`}>
                    {(field) => (
                      <field.Input
                        label="이름 경로"
                        placeholder="name 또는 response.name"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.emailVerifiedPath`}>
                    {(field) => (
                      <field.Input
                        label="이메일 인증 여부 경로"
                        placeholder="email_verified"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`${providerKey}.name`}>
                    {(field) => (
                      <field.Input
                        label="서비스 표시 이름"
                        placeholder={meta.name}
                        className="text-xs"
                      />
                    )}
                  </form.AppField>

                  <form.AppField name={`${providerKey}.scope`}>
                    {(field) => (
                      <field.Input
                        label="요청 권한 (Scope)"
                        placeholder="openid profile email"
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
                        label="Client ID / App Key"
                        placeholder="클라이언트 ID 또는 App Key"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>

                  <form.AppField name={`${providerKey}.clientSecret`}>
                    {(field) => (
                      <field.Input
                        type="password"
                        label="Client Secret / Secret Key"
                        placeholder="클라이언트 Secret 또는 Secret Key"
                        className="font-mono text-xs"
                      />
                    )}
                  </form.AppField>
                </div>
                <p className="-mt-4 text-xs text-muted-foreground">공급자를 활성화하려면 Client Secret도 저장되어 있어야 합니다. 비워서 저장하면 기존 값이 유지됩니다.</p>

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
                        label="배경색"
                        className="h-9 w-16 cursor-pointer p-1"
                      />
                    )}
                  </form.AppField>

                  <form.AppField name={`${providerKey}.brandTextColor`}>
                    {(field) => (
                      <field.Input
                        type="color"
                        label="텍스트색"
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
                      개발자 콘솔 필수 체크리스트
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
