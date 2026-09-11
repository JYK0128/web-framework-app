import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Code2, Info, Mail, MessageCircle, MessageSquare, Phone, RefreshCw, Send, Sparkles } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getMessageTemplatesControllerGetMessageTemplatesQueryKey, useMessageTemplatesControllerCreateMessageTemplate, useMessageTemplatesControllerGetMessageTemplateCatalog, useMessageTemplatesControllerUpdateMessageTemplate } from '#/.generated/api/endpoints/message-templates/message-templates';
import type { MessageChannel, MessageTemplateCatalogItemDto, MessageTemplateChannelDto, MessageTemplateItemDto, TemplateVariableMetadataDto } from '#/.generated/api/model';
import { Badge, Button, DialogFooter, Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

export type ChannelFormData = Pick<MessageTemplateChannelDto, 'isActive' | 'body' | 'priority'> & {
  title: string
};

const SUPPORTED_CHANNELS: MessageChannel[] = [
  'EMAIL',
  'ALIMTALK',
  'SMS',
  'SLACK',
  'IN_APP',
];

interface TemplateEditorFormProps {
  template: MessageTemplateItemDto | null
  onSuccess: () => void
  onOpenTestSend?: () => void
}

function getChannelIcon(channel: MessageChannel) {
  switch (channel) {
    case 'EMAIL':
      return <Mail className="size-3.5" />;
    case 'ALIMTALK':
      return <MessageCircle className="size-3.5" />;
    case 'SMS':
      return <Phone className="size-3.5" />;
    case 'SLACK':
      return <MessageSquare className="size-3.5" />;
    case 'IN_APP':
      return <Sparkles className="size-3.5" />;
    default:
      return null;
  }
}

function getChannelBodyPlaceholder(channel: MessageChannel): string {
  if (channel === 'EMAIL') {
    return '<div style="...">\n  <h2>{{appName}} 인증</h2>\n  <p>{{userName}}님 안녕하세요.</p>\n</div>';
  }
  if (channel === 'SLACK') {
    return '새 문의가 접수되었습니다.\n*제목*: {{title}}\n*작성자*: {{userName}}';
  }
  return '[{{appName}}] 인증번호는 [{{code}}]입니다.';
}

function getChannelBodyHint(channel: MessageChannel): string {
  if (channel === 'EMAIL') {
    return 'HTML 인라인 스타일 및 {{변수명}} 치환 문법을 지원합니다.';
  }
  if (channel === 'SLACK') {
    return 'Slack mrkdwn 포맷(*굵게*, _기울임_, <URL|링크>) 및 {{변수명}}을 지원합니다.';
  }
  return '{{변수명}}을 삽입하면 발송 시 실제 값으로 자동 치환됩니다.';
}

function calculateByteLength(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes += code > 127 ? 2 : 1;
  }
  return bytes;
}

export function TemplateEditorForm({
  template,
  onSuccess,
  onOpenTestSend,
}: TemplateEditorFormProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // 1. 카탈로그 API 조회
  const { data: catalogData } = useMessageTemplatesControllerGetMessageTemplateCatalog();
  const createMutation = useMessageTemplatesControllerCreateMessageTemplate();
  const updateMutation = useMessageTemplatesControllerUpdateMessageTemplate();

  const isEditing = Boolean(template);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [activeTab, setActiveTab] = useState<MessageChannel>('EMAIL');
  const [selectedPreset, setSelectedPreset] = useState<string>(template?.code ?? '__custom__');
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // 채널별 초기 데이터 매핑
  const initialChannels = useMemo(() => {
    const channelMap: Record<MessageChannel, ChannelFormData> = {
      EMAIL: { isActive: true, title: '', body: '', priority: 1 },
      ALIMTALK: { isActive: false, title: '', body: '', priority: 2 },
      SMS: { isActive: false, title: '', body: '', priority: 3 },
      SLACK: { isActive: false, title: '', body: '', priority: 1 },
      IN_APP: { isActive: false, title: '', body: '', priority: 1 },
    };

    if (template?.channels) {
      for (const ch of template.channels) {
        if (ch.channel && channelMap[ch.channel]) {
          channelMap[ch.channel] = {
            isActive: ch.isActive,
            title: ch.title ?? '',
            body: ch.body,
            priority: ch.priority ?? 1,
          };
        }
      }
    }

    return channelMap;
  }, [template]);

  const [channelsState, setChannelsState] = useState<Record<MessageChannel, ChannelFormData>>(initialChannels);

  let submitText = isEditing ? t('messageManagement.save') : t('messageManagement.create');
  if (isPending) {
    submitText = t('messageManagement.processing');
  }

  const form = useAppForm({
    defaultValues: {
      code: template?.code ?? '',
      name: template?.name ?? '',
      variablesInput: template?.variables?.join(', ') ?? 'userName, code',
      description: template?.description ?? '',
      isActive: template?.isActive ?? true,
    },
    onSubmit: async ({ value }) => {
      try {
        const code = value.code.trim().toUpperCase();
        const name = value.name.trim();

        if (!code || !name) {
          toast.error(t('messageManagement.requiredFieldsAlert', '템플릿 코드와 명칭을 입력해주세요.'));
          return;
        }

        const activeChannels = SUPPORTED_CHANNELS
          .filter((ch) => channelsState[ch].isActive)
          .map((ch) => ({
            channel: ch,
            title: channelsState[ch].title.trim() || null,
            body: channelsState[ch].body,
            priority: channelsState[ch].priority,
            isActive: true,
          }));

        if (activeChannels.length === 0) {
          toast.error(t('messageManagement.atLeastOneChannel', '최소 1개 이상의 발송 채널을 활성화해야 합니다.'));
          return;
        }

        for (const ch of activeChannels) {
          if (!ch.body || ch.body.trim().length === 0) {
            toast.error(t('messageManagement.channelBodyEmpty', `${ch.channel} 채널의 본문 내용을 입력해주세요.`));
            setActiveTab(ch.channel);
            return;
          }
        }

        const variables = value.variablesInput
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

        if (template) {
          await updateMutation.mutateAsync({
            id: template.id,
            data: {
              code,
              name,
              variables,
              description: value.description.trim() || null,
              isActive: value.isActive,
              channels: activeChannels,
            },
          });
        }
        else {
          await createMutation.mutateAsync({
            data: {
              code,
              name,
              variables,
              description: value.description.trim() || null,
              isActive: value.isActive,
              channels: activeChannels,
            },
          });
        }

        await queryClient.invalidateQueries({
          queryKey: getMessageTemplatesControllerGetMessageTemplatesQueryKey(),
        });
        onSuccess();
      }
      catch {
        // MutationCache handles error toasts
      }
    },
  });

  const catalogMap = useMemo(() => {
    const map = new Map<string, MessageTemplateCatalogItemDto>();
    if (!catalogData?.items) return map;
    for (const item of catalogData.items) {
      map.set(item.code, item);
    }
    return map;
  }, [catalogData]);

  const handleSelectPreset = (presetCode: string) => {
    setSelectedPreset(presetCode);
    if (presetCode === '__custom__') return;

    const catalogItem = catalogMap.get(presetCode);
    if (!catalogItem) return;

    form.setFieldValue('code', catalogItem.code);
    form.setFieldValue('name', catalogItem.name);
    form.setFieldValue('description', catalogItem.description);
    form.setFieldValue(
      'variablesInput',
      catalogItem.variables.map((v: TemplateVariableMetadataDto) => v.key).join(', '),
    );

    setChannelsState((prev) => {
      const next = { ...prev };
      for (const ch of SUPPORTED_CHANNELS) {
        next[ch] = { ...next[ch], isActive: false };
      }

      if (catalogItem.channels && catalogItem.channels.length > 0) {
        for (const catCh of catalogItem.channels) {
          const chKey = catCh.channel as MessageChannel;
          if (next[chKey]) {
            next[chKey] = {
              isActive: true,
              title: catCh.defaultTitle ?? '',
              body: catCh.defaultBody ?? '',
              priority: catCh.priority ?? 1,
            };
          }
        }
        setActiveTab(catalogItem.channels[0].channel as MessageChannel);
      }
      return next;
    });
  };

  const handleInsertKeyword = (key: string) => {
    const currentChannel = activeTab;
    const textarea = textareaRefs.current[currentChannel];
    const token = `{{${key}}}`;

    if (textarea) {
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      const currentVal = channelsState[currentChannel].body;
      const nextVal = currentVal.slice(0, start) + token + currentVal.slice(end);

      setChannelsState((prev) => ({
        ...prev,
        [currentChannel]: {
          ...prev[currentChannel],
          body: nextVal,
        },
      }));

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    }
    else {
      setChannelsState((prev) => ({
        ...prev,
        [currentChannel]: {
          ...prev[currentChannel],
          body: prev[currentChannel].body ? `${prev[currentChannel].body} ${token}` : token,
        },
      }));
    }

    if (!key.startsWith('brand.') && !key.startsWith('system.')) {
      const currentVars = form.getFieldValue('variablesInput')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      if (!currentVars.includes(key)) {
        form.setFieldValue(
          'variablesInput',
          [...currentVars, key].join(', '),
        );
      }
    }
  };

  const currentChannelData = channelsState[activeTab];
  const byteLength = calculateByteLength(currentChannelData?.body ?? '');

  return (
    <form.AppForm>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex flex-col gap-5 pt-2"
      >
        {!isEditing && catalogData?.items && catalogData.items.length > 0 && (
          <div className="
            flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5
            p-3
            sm:flex-row sm:items-center sm:justify-between
          "
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <div>
                <div className="text-xs font-semibold text-foreground">
                  {t('messageManagement.catalogPresetTitle', '표준 템플릿 프리셋')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('messageManagement.catalogPresetDesc', '사전 정의된 시나리오와 채널별 표준 템플릿을 자동으로 채웁니다.')}
                </div>
              </div>
            </div>

            <select
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="
                h-8 rounded-lg border border-input bg-background px-2.5 text-xs
                font-medium text-foreground shadow-xs
                focus:outline-hidden focus:ring-1 focus:ring-ring
              "
            >
              <option value="__custom__">
                {t('messageManagement.customDirectInput', '직접 새로 작성 (Custom)')}
              </option>
              {catalogData.items.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.name}
                  {' '}
                  (
                  {cat.code}
                  )
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="
          grid grid-cols-1 gap-4
          sm:grid-cols-2
        "
        >
          <form.AppField name="code">
            {(field) => (
              <field.Input
                label={t('messageManagement.codeField')}
                placeholder="예: AUTH_VERIFY_EMAIL"
                description={t('messageManagement.codeDescription', '비즈니스 시나리오 식별 고유 코드')}
                disabled={isEditing}
              />
            )}
          </form.AppField>

          <form.AppField name="name">
            {(field) => (
              <field.Input
                label={t('messageManagement.nameField')}
                placeholder="예: 회원가입 이메일 인증"
                description={t('messageManagement.nameDescription', '관리자 화면에 표시될 명칭')}
              />
            )}
          </form.AppField>
        </div>

        <form.AppField name="description">
          {(field) => (
            <field.Input
              label={t('messageManagement.descriptionField')}
              placeholder="예: 회원가입 시 인증 링크를 전송하는 템플릿입니다."
              description={t('messageManagement.descriptionGuide', '발송 시점 및 용도 설명')}
            />
          )}
        </form.AppField>

        <div className="rounded-xl border border-border bg-muted/30 p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="
              flex items-center gap-1.5 text-xs font-semibold text-foreground
            "
            >
              <Code2 className="size-3.5 text-primary" />
              <span>{t('messageManagement.variablesGuideTitle', '지원 키워드 (클릭하여 현재 채널 본문에 삽입)')}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      h-6 px-1.5 text-[11px] text-muted-foreground
                      hover:text-foreground
                    "
                    onClick={() => {
                      const currentBody = channelsState[activeTab].body;
                      const matches = Array.from(currentBody.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g))
                        .map((m) => m[1])
                        .filter((k) => !k.startsWith('brand.') && !k.startsWith('system.'));
                      const unique = Array.from(new Set(matches));
                      if (unique.length > 0) {
                        form.setFieldValue('variablesInput', unique.join(', '));
                        toast.success(`${unique.length}개 이벤트 변수가 동기화되었습니다.`);
                      }
                      else {
                        toast.info('추출할 3계층 이벤트 변수가 없습니다. (브랜드/시스템 변수는 자동 주입됩니다)');
                      }
                    }}
                  >
                    <RefreshCw className="size-3 mr-1" />
                    <span>{t('messageManagement.syncVarsBtn', '이벤트 변수 추출')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t('messageManagement.syncVarsTooltip', '현재 채널 본문에 쓰인 3계층 이벤트 변수를 목록으로 자동 갱신합니다.')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 3계층 키워드 툴바 */}
          <div className="
            space-y-3 mb-3 p-3 rounded-lg border border-border/70 bg-muted/20
          "
          >
            {/* 1계층: 전역 브랜드/회사 상수 */}
            {catalogData?.brandVariables && catalogData.brandVariables.length > 0 && (
              <div>
                <div className="
                  text-[11px] font-semibold text-purple-600
                  dark:text-purple-400
                  mb-1.5 flex items-center gap-1.5
                "
                >
                  <span className="size-2 rounded-full bg-purple-500" />
                  <span>1계층: 브랜드/회사 상수</span>
                  <span className="
                    text-[10px] text-muted-foreground font-normal
                  "
                  >
                    (시스템 자동 주입)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <TooltipProvider>
                    {catalogData.brandVariables.map((v) => (
                      <Tooltip key={v.key}>
                        <TooltipTrigger>
                          <button
                            type="button"
                            onClick={() => handleInsertKeyword(v.key)}
                            className="
                              group inline-flex items-center gap-1 rounded-md
                              border border-purple-500/30 bg-purple-500/10 px-2
                              py-0.5 text-xs font-mono font-medium
                              text-purple-700
                              dark:text-purple-300
                              hover:bg-purple-500/20
                              transition-colors
                            "
                          >
                            <span>{`{{${v.key}}}`}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="font-semibold">
                            {v.label}
                            {' '}
                            (
                            {v.key}
                            )
                          </div>
                          <div className="text-xs text-muted-foreground">{v.description}</div>
                          <div className="
                            mt-1 text-[11px] text-purple-600
                            dark:text-purple-400
                          "
                          >
                            기본값:
                            {' '}
                            {v.sampleValue}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </div>
            )}

            {/* 2계층: 시스템 예약 런타임 변수 */}
            {catalogData?.systemVariables && catalogData.systemVariables.length > 0 && (
              <div>
                <div className="
                  text-[11px] font-semibold text-slate-700
                  dark:text-slate-300
                  mb-1.5 flex items-center gap-1.5
                "
                >
                  <span className="size-2 rounded-full bg-slate-500" />
                  <span>2계층: 시스템 런타임 변수</span>
                  <span className="
                    text-[10px] text-muted-foreground font-normal
                  "
                  >
                    (발송 시 자동 계산)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <TooltipProvider>
                    {catalogData.systemVariables.map((v) => (
                      <Tooltip key={v.key}>
                        <TooltipTrigger>
                          <button
                            type="button"
                            onClick={() => handleInsertKeyword(v.key)}
                            className="
                              group inline-flex items-center gap-1 rounded-md
                              border border-slate-500/30 bg-slate-500/10 px-2
                              py-0.5 text-xs font-mono font-medium
                              text-slate-700
                              dark:text-slate-300
                              hover:bg-slate-500/20
                              transition-colors
                            "
                          >
                            <span>{`{{${v.key}}}`}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="font-semibold">
                            {v.label}
                            {' '}
                            (
                            {v.key}
                            )
                          </div>
                          <div className="text-xs text-muted-foreground">{v.description}</div>
                          <div className="
                            mt-1 text-[11px] text-slate-600
                            dark:text-slate-400
                          "
                          >
                            현재 시점 값:
                            {' '}
                            {v.sampleValue}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </div>
            )}

            {/* 3계층: 비즈니스 이벤트 페이로드 변수 */}
            <div>
              <div className="
                text-[11px] font-semibold text-primary mb-1.5 flex items-center
                gap-1.5
              "
              >
                <span className="size-2 rounded-full bg-primary" />
                <span>3계층: 이벤트 페이로드 변수</span>
                <span className="text-[10px] text-muted-foreground font-normal">(발송 트리거 시 동적 주입)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <TooltipProvider>
                  {catalogData?.items
                    ?.find((c) => c.code === form.getFieldValue('code'))
                    ?.variables?.map((v) => (
                      <Tooltip key={v.key}>
                        <TooltipTrigger>
                          <button
                            type="button"
                            onClick={() => handleInsertKeyword(v.key)}
                            className="
                              group inline-flex items-center gap-1 rounded-md
                              border border-primary/30 bg-primary/10 px-2 py-0.5
                              text-xs font-mono font-medium text-primary
                              hover:bg-primary/20
                              transition-colors
                            "
                          >
                            <span>{`{{${v.key}}}`}</span>
                            {v.required && (
                              <span className="
                                text-[10px] text-destructive font-bold
                              "
                              >
                                *
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="font-semibold">
                            {v.label}
                            {' '}
                            (
                            {v.key}
                            )
                          </div>
                          <div className="text-xs text-muted-foreground">{v.description}</div>
                          <div className="mt-1 text-[11px] text-primary/80">
                            예시값:
                            {' '}
                            {v.sampleValue}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                </TooltipProvider>
              </div>
            </div>
          </div>

          <form.AppField name="variablesInput">
            {(field) => (
              <field.Input
                placeholder="userName, targetLink, code"
                description={t('messageManagement.variablesGuide', '3계층 이벤트 동적 변수를 쉼표(,)로 구분하여 정의합니다. (1계층 브랜드 상수 및 2계층 시스템 변수는 시스템에서 자동 주입됩니다)')}
              />
            )}
          </form.AppField>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {t('messageManagement.channelConfigTitle', '발송 채널별 템플릿 설정')}
              </span>
              <span className="text-xs text-muted-foreground">
                (활성화된 채널로 옴니채널 발송 및 Fallback 지원)
              </span>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as MessageChannel)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 h-10 p-1 bg-muted/60">
              {SUPPORTED_CHANNELS.map((channel) => {
                const isChActive = channelsState[channel].isActive;
                return (
                  <TabsTrigger
                    key={channel}
                    value={channel}
                    className="
                      relative flex items-center gap-1.5 text-xs font-medium
                      data-[state=active]:bg-background
                      data-[state=active]:shadow-xs
                    "
                  >
                    {getChannelIcon(channel)}
                    <span>{channel}</span>
                    {isChActive && (
                      <span
                        className="
                          size-1.5 rounded-full bg-emerald-500 shrink-0
                        "
                        title="활성화됨"
                      />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {SUPPORTED_CHANNELS.map((channel) => {
              const chData = channelsState[channel];
              const isEmail = channel === 'EMAIL';
              const isSms = channel === 'SMS';
              const isAlimtalk = channel === 'ALIMTALK';
              const isSlack = channel === 'SLACK';

              return (
                <TabsContent
                  key={channel}
                  value={channel}
                  className="pt-4 flex flex-col gap-4"
                >
                  <div className="
                    flex flex-wrap items-center justify-between gap-3 rounded-lg
                    border border-border/70 bg-muted/20 px-3.5 py-2.5
                  "
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        id={`channel-switch-${channel}`}
                        checked={chData.isActive}
                        onCheckedChange={(checked) => {
                          setChannelsState((prev) => ({
                            ...prev,
                            [channel]: { ...prev[channel], isActive: checked },
                          }));
                        }}
                      />
                      <Label
                        htmlFor={`channel-switch-${channel}`}
                        className="cursor-pointer text-xs font-semibold"
                      >
                        {chData.isActive
                          ? (
                            <span className="
                              text-emerald-600
                              dark:text-emerald-400
                              font-medium flex items-center gap-1
                            "
                            >
                              <CheckCircle2 className="size-3.5" />
                              {channel}
                              {' '}
                              채널 발송 활성화됨
                            </span>
                          )
                          : (
                            <span className="text-muted-foreground font-normal">
                              {channel}
                              {' '}
                              채널 발송 비활성화 (발송 제외)
                            </span>
                          )}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] text-muted-foreground">발송 우선순위 (Fallback 순서):</Label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={chData.priority}
                        onChange={(e) => {
                          const val = Number.parseInt(e.target.value, 10) || 1;
                          setChannelsState((prev) => ({
                            ...prev,
                            [channel]: { ...prev[channel], priority: val },
                          }));
                        }}
                        className="
                          h-7 w-14 rounded-sm border border-input bg-background
                          px-2 text-center text-xs font-medium
                        "
                      />
                    </div>
                  </div>

                  {(isEmail || isSlack || channel === 'IN_APP') && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold">
                        {t('messageManagement.channelTitleLabel', `${channel} 알림 제목`)}
                      </Label>
                      <input
                        type="text"
                        value={chData.title}
                        placeholder={isEmail ? '[{{appName}}] 안내 메일' : '알림 제목'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setChannelsState((prev) => ({
                            ...prev,
                            [channel]: { ...prev[channel], title: val },
                          }));
                        }}
                        className="
                          h-9 w-full rounded-md border border-input
                          bg-background px-3 text-xs font-normal shadow-xs
                          focus:outline-hidden focus:ring-1 focus:ring-ring
                        "
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        {t('messageManagement.bodyField', `${channel} 템플릿 본문`)}
                      </Label>

                      {(isSms || isAlimtalk) && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={byteLength > 90
                            ? `text-amber-600 font-semibold`
                            : `text-muted-foreground`}
                          >
                            {byteLength}
                            {' '}
                            bytes (
                            {chData.body.length}
                            자)
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5"
                          >
                            {byteLength <= 90 ? '단문 (SMS)' : '장문 (LMS)'}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <Textarea
                      ref={(el) => {
                        textareaRefs.current[channel] = el;
                      }}
                      value={chData.body}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChannelsState((prev) => ({
                          ...prev,
                          [channel]: { ...prev[channel], body: val },
                        }));
                      }}
                      placeholder={getChannelBodyPlaceholder(channel)}
                      className="min-h-[220px] font-mono text-xs/relaxed"
                    />

                    <div className="
                      flex items-center gap-1.5 text-[11px]
                      text-muted-foreground
                    "
                    >
                      <Info className="size-3 text-muted-foreground/80 shrink-0" />
                      <span>{getChannelBodyHint(channel)}</span>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        <form.AppField name="isActive">
          {(field) => (
            <field.Switch
              label={t('messageManagement.isActiveField')}
              description="이 템플릿의 전체 발송 허용 여부를 설정합니다."
            />
          )}
        </form.AppField>

        <DialogFooter className="
          gap-2
          sm:gap-0
          pt-2 border-t border-border
        "
        >
          {isEditing && onOpenTestSend && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenTestSend}
              className="
                mr-auto gap-1.5 text-xs text-primary
                hover:text-primary
              "
            >
              <Send className="size-3.5" />
              <span>{t('messageManagement.testSendBtn', '테스트 발송')}</span>
            </Button>
          )}
          <Button type="submit" disabled={isPending} className="min-w-24">
            {submitText}
          </Button>
        </DialogFooter>
      </form>
    </form.AppForm>
  );
}
