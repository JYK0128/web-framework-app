import { Plus, Search, Trash2 } from 'lucide-react';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { OAuthConfigDto, OAuthProviderDetailDto } from '#/.generated/api/model';
import { Badge, Button, Input } from '#/.generated/shadcn/components/ui';
import { OAuthProviderIcon } from '#/components/app';
import { openDialog } from '#/components/dialog';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { uploadOAuthIcon } from '#/core/api/uploads';
import { useI18n } from '#/hooks';

import type { OAuthProviderMeta } from './oauth-provider.types';
import { OAuthProviderAddDialog } from './oauth-provider-add-dialog';
import { OAuthProviderDetail } from './oauth-provider-detail';

type OAuthProviderConfig = OAuthProviderDetailDto & {
  iconUrl?: string
};

type OAuthFormProvider = OAuthProviderConfig & {
  iconFiles: File[]
};

export type OAuthMap = Record<string, OAuthProviderConfig | undefined>;

function useOAuthForm(defaultValues: Record<string, OAuthFormProvider>) {
  return useAppForm({ defaultValues });
}

export type OAuthFormInstance = ReturnType<typeof useOAuthForm>;

export interface OAuthTabHandle {
  submitData: () => Promise<OAuthConfigDto | null>
  commitPendingUploads: () => void
}

export interface OAuthTabProps {
  oauth?: OAuthConfigDto | OAuthMap
}

export const OAuthTab = forwardRef<OAuthTabHandle, OAuthTabProps>(function OAuthTab(
  { oauth }: OAuthTabProps,
  ref,
) {
  const { t } = useI18n();
  const oauthMap = useMemo<OAuthMap>(() => (oauth as OAuthMap) ?? {}, [oauth]);

  // 1. 등록된 프로바이더 목록 키 관리
  const initialKeys = useMemo(() => {
    return Object.entries(oauthMap)
      .filter(([_, val]) => val && (val.clientId || val.enabled || val.clientSecret || val.authorizeUrl || val.tokenUrl || val.userInfoUrl || val.iconUrl))
      .map(([k]) => k);
  }, [oauthMap]);

  const [registeredKeys, setRegisteredKeys] = useState<string[]>(initialKeys);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(() => initialKeys[0] ?? '');
  const pendingIconUrlsRef = useRef<Record<string, string>>({});

  // 2. 검색 상태
  const [searchQuery, setSearchQuery] = useState('');

  // 3. 폼 기본값 구성
  const defaultValues = useMemo(() => {
    const values: Record<string, OAuthFormProvider> = {};

    for (const [key, val] of Object.entries(oauthMap)) {
      if (val) {
        values[key] = {
          enabled: val.enabled,
          name: val.name ?? '',
          clientId: val.clientId ?? '',
          clientSecret: '',
          authorizeUrl: val.authorizeUrl ?? '',
          tokenUrl: val.tokenUrl ?? '',
          userInfoUrl: val.userInfoUrl ?? '',
          revokeUrl: val.revokeUrl ?? '',
          scope: val.scope ?? '',
          icon: val.icon ?? '',
          iconUrl: val.iconUrl,
          brandColor: val.brandColor ?? '',
          iconFiles: [],
        };
      }
    }

    return values;
  }, [oauthMap]);

  const oauthForm = useOAuthForm(defaultValues);

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      const isValid = await oauthForm.validateAllFields('submit');
      if (!isValid) {
        return null;
      }
      const allValues = oauthForm.state.values;
      const filtered: Record<string, OAuthProviderConfig> = {};
      try {
        for (const key of registeredKeys) {
          const values = allValues[key];
          if (!values) continue;

          let iconUrl = values.iconUrl;
          const iconFile = values.iconFiles[0];
          if (iconFile) {
            const response = await uploadOAuthIcon(iconFile);
            iconUrl = response.url;
            pendingIconUrlsRef.current[key] = iconUrl;
          }

          const { iconFiles: _iconFiles, ...provider } = { ...values, iconUrl };
          filtered[key] = provider;
        }
      }
      catch (error) {
        toast.error(error instanceof Error ? error.message : '아이콘 업로드에 실패했습니다.');
        return null;
      }
      return filtered;
    },
    commitPendingUploads: () => {
      for (const [key, iconUrl] of Object.entries(pendingIconUrlsRef.current)) {
        oauthForm.setFieldValue(`${key}.iconUrl`, iconUrl);
        oauthForm.setFieldValue(`${key}.iconFiles`, []);
      }
      pendingIconUrlsRef.current = {};
    },
  }));

  // 프로바이더 메타 정보 조회 (oauthMap 기반으로 안전하게 캐싱)
  const resolveMeta = useCallback((key: string): OAuthProviderMeta => {
    const existing = oauthMap[key];
    return { id: key, name: existing?.name ?? '', icon: existing?.icon, iconUrl: existing?.iconUrl, brandColor: existing?.brandColor, defaultScope: existing?.scope };
  }, [oauthMap]);

  // 서비스 추가 다이얼로그 열기
  const handleOpenAdd = async () => {
    const meta = await openDialog(
      OAuthProviderAddDialog,
      { registeredKeys },
      { dialogId: 'oauth-provider-add' },
    );
    if (!meta) return;

    setRegisteredKeys((prev) => [...prev, meta.id]);
    oauthForm.setFieldValue(meta.id, {
      enabled: true,
      name: meta.name,
      clientId: '',
      clientSecret: '',
      authorizeUrl: '',
      tokenUrl: '',
      userInfoUrl: '',
      revokeUrl: '',
      scope: meta.defaultScope || '',
      icon: meta.icon || '',
      iconUrl: meta.iconUrl || '',
      brandColor: meta.brandColor || '',
      iconFiles: [],
    });
    setSelectedProviderId(meta.id);
    toast.success(`${meta.name} ${t('systemManagement.oauth.presetAdd')}`);
  };

  // 커스텀 프로바이더 제거
  const handleRemoveProvider = (key: string) => {
    oauthForm.setFieldValue(`${key}.enabled`, false);
    setRegisteredKeys((prev) => prev.filter((k) => k !== key));
    if (selectedProviderId === key) {
      const remaining = registeredKeys.filter((k) => k !== key);
      setSelectedProviderId(remaining[0] ?? '');
    }
    toast.success(t('systemManagement.oauth.removeProvider'));
  };

  // 필터링 및 검색 적용된 메타 목록
  const filteredMetas = useMemo(() => {
    return registeredKeys
      .map(resolveMeta)
      .filter((meta) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchId = meta.id.toLowerCase().includes(q);
        const matchName = meta.name.toLowerCase().includes(q);
        const localizedName = t(`systemManagement.oauth.providers.${meta.id}.name`, {
          defaultValue: '',
        }).toLowerCase();
        return matchId || matchName || localizedName.includes(q);
      });
  }, [registeredKeys, searchQuery, t, resolveMeta]);

  // 현재 선택된 프로바이더 메타
  const selectedMeta = useMemo(() => {
    const found = filteredMetas.find((m) => m.id === selectedProviderId);
    if (found) return found;

    return filteredMetas[0] ?? (registeredKeys.length > 0 ? resolveMeta(registeredKeys[0]) : null);
  }, [filteredMetas, selectedProviderId, registeredKeys, resolveMeta]);

  return (
    <oauthForm.AppForm>
      <FormLayout
        id="oauth-form"
        onSubmit={() => void oauthForm.handleSubmit()}
        className="w-full"
      >
        <div className="
          grid grid-cols-1
          lg:grid-cols-[20rem_minmax(0,1fr)]
          gap-6
          lg:overflow-hidden lg:h-[calc(100vh-14.5rem)] lg:min-h-[580px]
          pb-6
          lg:pb-0
        "
        >
          {/* 좌측 패널: 프로바이더 목록 (SectionCard) */}
          <div className="
            h-[340px]
            lg:h-full
          "
          >
            <SectionCard
              textSize="sm"
              title={t('systemManagement.oauth.title')}
              description={t('systemManagement.oauth.selectProvider', {
                count: registeredKeys.length,
                defaultValue: `등록된 서비스 ${registeredKeys.length}개`,
              })}
            >
              <SectionCard.Actions>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleOpenAdd()}
                  className="gap-1 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>{t('systemManagement.oauth.addProvider')}</span>
                </Button>
              </SectionCard.Actions>

              <SectionCard.Content className="
                grid grid-rows-[auto_minmax(0,1fr)] p-0
              "
              >
                {/* 검색창 */}
                <div className="border-b p-2">
                  <div className="relative">
                    <Search className="
                      pointer-events-none absolute left-2.5 top-1/2 size-4
                      -translate-y-1/2 text-muted-foreground
                    "
                    />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('systemManagement.oauth.searchPlaceholder')}
                      className="h-8.5 pl-8 text-xs"
                    />
                  </div>
                </div>

                {/* 공급자 스크롤 목록 */}
                <div className="scroll-y p-2">
                  <div className="flex flex-col gap-1.5">
                    {filteredMetas.map((meta) => {
                      const isSelected = meta.id === selectedMeta?.id;
                      const translatedName = t(`systemManagement.oauth.providers.${meta.id}.name`, {
                        defaultValue: meta.name,
                      });

                      return (
                        <oauthForm.Subscribe
                          key={meta.id}
                          selector={(state) => [
                            state.values[meta.id]?.enabled,
                            state.values[meta.id]?.clientId ?? '',
                            state.values[meta.id]?.name ?? '',
                            state.values[meta.id]?.iconUrl || '',
                          ]}
                        >
                          {(tuple) => {
                            const [isEnabled, clientId, formName, iconUrl] = tuple;
                            const isConfigured = Boolean(clientId);
                            const displayName = formName || translatedName;
                            return (
                              <div
                                onClick={() => setSelectedProviderId(meta.id)}
                                className={`
                                  group flex w-full items-center justify-between
                                  rounded-lg border p-2.5 text-left text-xs
                                  transition-all cursor-pointer
                                  ${
                              isSelected
                                ? `
                                  border-primary bg-primary/10 font-semibold
                                  text-foreground shadow-2xs ring-1
                                  ring-primary/30
                                `
                                : `
                                  border-border/60 bg-card text-muted-foreground
                                  hover:border-border hover:bg-accent/50
                                  hover:text-foreground
                                `
                              }
                                `}
                              >
                                {/* 좌측: 로고/아이콘 + 이름/키 */}
                                <div className="
                                  flex flex-1 items-center gap-2.5
                                "
                                >
                                  <div className="
                                    size-7 rounded-md bg-muted/80 flex
                                    items-center justify-center shrink-0 border
                                    border-border/40 overflow-hidden
                                  "
                                  >
                                    <OAuthProviderIcon
                                      iconUrl={typeof iconUrl === 'string' && iconUrl ? iconUrl : meta.iconUrl}
                                      className="size-4 shrink-0"
                                    />
                                  </div>

                                  <div className="grid gap-0.5 truncate">
                                    <div className="flex items-center gap-1.5">
                                      <span className="
                                        truncate font-semibold text-foreground
                                      "
                                      >
                                        {displayName}
                                      </span>
                                    </div>
                                    <span className="
                                      font-mono text-[10px]
                                      text-muted-foreground truncate
                                    "
                                    >
                                      {meta.id}
                                      {isEnabled && (
                                        <span className="
                                          ml-1.5 text-emerald-600
                                          dark:text-emerald-400
                                          font-sans
                                        "
                                        >
                                          ·
                                          {' '}
                                          {isConfigured ? '정상 연동' : '설정 필요'}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {/* 우측: 활성 상태 뱃지 및 액션 */}
                                <div className="
                                  flex items-center gap-1.5 shrink-0
                                "
                                >
                                  <Badge
                                    variant={isEnabled ? 'default' : 'secondary'}
                                    className={`
                                      text-[10px] px-1.5 py-0 h-4 font-normal
                                      ${
                              isEnabled
                                ? `
                                  bg-emerald-500/15 text-emerald-700
                                  dark:text-emerald-400
                                  border border-emerald-500/30
                                `
                                : ''
                              }
                                    `}
                                  >
                                    {isEnabled
                                      ? t('systemManagement.oauth.enabled')
                                      : t('systemManagement.oauth.disabled')}
                                  </Badge>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveProvider(meta.id);
                                    }}
                                    title={t('systemManagement.oauth.removeProvider')}
                                    className="
                                      text-destructive/80
                                      hover:text-destructive
                                      hover:bg-destructive/10
                                      opacity-80
                                      group-hover:opacity-100
                                    "
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          }}
                        </oauthForm.Subscribe>
                      );
                    })}

                    {filteredMetas.length === 0 && (
                      <div className="
                        text-center py-8 text-muted-foreground text-xs
                      "
                      >
                        {t('systemManagement.oauth.noResults')}
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard.Content>
            </SectionCard>
          </div>

          {/* 우측 패널: 선택된 공급자 상세 설정 패널 */}
          {selectedMeta
            ? (
              <OAuthProviderDetail
                key={selectedMeta.id}
                meta={selectedMeta}
                form={oauthForm}
                onRemove={() => handleRemoveProvider(selectedMeta.id)}
              />
            )
            : (
              <div className="
                flex flex-col items-center justify-center p-12 text-center
                rounded-xl border border-dashed bg-muted/20 min-h-[240px]
                lg:h-full
              "
              >
                <div className="
                  size-12 rounded-full bg-muted/60 flex items-center
                  justify-center mb-3
                "
                >
                  <Search className="size-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium">
                  {t('systemManagement.oauth.noResults')}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {t('systemManagement.oauth.noResultsDesc')}
                </p>
              </div>
            )}
        </div>
      </FormLayout>
    </oauthForm.AppForm>
  );
});
