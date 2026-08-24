import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Eye, FileEdit, Globe, Mail, MessageSquare, Send, Sparkles } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getMessageTemplatesControllerGetMessageTemplatesQueryKey, useMessageTemplatesControllerUpdateMessageTemplate } from '#/.generated/api/endpoints/message-templates/message-templates';
import type { MessageTemplateItemDto } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '#/.generated/shadcn/components/ui';

import { TemplateTestSendDialog } from './TemplateTestSendDialog';

interface TemplateEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: MessageTemplateItemDto | null
  allTemplates: MessageTemplateItemDto[]
}

function getChannelBadgeClass(channel: string): string {
  if (channel === 'EMAIL') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900';
  if (channel === 'SLACK') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
  return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900';
}

const MOCK_VARIABLES: Record<string, string> = {
  appName: 'Antigravity App',
  userName: '홍길동',
  author: '홍길동',
  title: '회원 탈퇴 및 정보 변경 건',
  category: '계정/인증',
  assignee: '김상담',
  minutes: '10',
  elapsedMinutes: '15',
  code: '829314',
  targetLink: 'https://example.com/verify?code=829314',
  linkUrl: 'https://example.com/inquiries/01JGXYZ',
  inquiryId: '01JGXYZABC12345',
};

function renderMockText(text: string): string {
  if (!text) return '';
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    return MOCK_VARIABLES[key] ?? `[${key}]`;
  });
}

interface InnerFormProps {
  currentTemplate: MessageTemplateItemDto
  initialTemplate: MessageTemplateItemDto
  onOpenChange: (open: boolean) => void
  onOpenTestSend: () => void
}

function TemplateEditorInnerForm({
  currentTemplate,
  initialTemplate,
  onOpenChange,
  onOpenTestSend,
}: InnerFormProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const updateMutation = useMessageTemplatesControllerUpdateMessageTemplate();

  const [title, setTitle] = useState(currentTemplate.title ?? '');
  const [body, setBody] = useState(currentTemplate.body ?? '');
  const [isActive, setIsActive] = useState(currentTemplate.isActive ?? true);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmail = initialTemplate.channel === 'EMAIL';
  const isSlack = initialTemplate.channel === 'SLACK';
  const isInApp = initialTemplate.channel === 'IN_APP';

  const previewTitle = useMemo(() => renderMockText(title), [title]);
  const previewBody = useMemo(() => renderMockText(body), [body]);

  const handleInsertVariable = (varName: string) => {
    const placeholder = `{{${varName}}}`;
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => `${prev} ${placeholder}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextBody = body.substring(0, start) + placeholder + body.substring(end);
    setBody(nextBody);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
    toast.success(`변수 ${placeholder} 가 삽입되었습니다.`);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: currentTemplate.id,
        data: {
          title: title.trim() ? title : null,
          body,
          isActive,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: getMessageTemplatesControllerGetMessageTemplatesQueryKey(),
      });

      toast.success(t('templates.saveSuccess'));
      onOpenChange(false);
    }
    catch {
      toast.error(t('templates.saveFailed'));
    }
  };

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        {/* Control Bar */}
        <div className="
          flex flex-wrap items-center justify-between gap-3 pb-3 shrink-0
        "
        >
          <TabsList className="h-9 p-1">
            <TabsTrigger value="edit" className="gap-1.5 text-xs px-3.5 h-7">
              <FileEdit className="size-3.5" />
              <span>{t('templates.edit')}</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5 text-xs px-3.5 h-7">
              <Eye className="size-3.5" />
              <span>{t('templates.preview')}</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="templateActive"
                className="
                  text-xs font-medium text-muted-foreground cursor-pointer
                "
              >
                {t('common.manage')}
              </Label>
              <Switch
                id="templateActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
            <div className="h-4 w-px bg-border" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenTestSend}
              className="gap-1.5 text-xs h-8"
            >
              <Send className="size-3.5" />
              {t('templates.testSend')}
            </Button>
          </div>
        </div>

        {/* Edit Tab Content */}
        <TabsContent
          value="edit"
          className="flex-1 overflow-y-auto space-y-4 m-0 pr-1"
        >
          {/* Variable Pills Card */}
          {initialTemplate.variables && initialTemplate.variables.length > 0 && (
            <div className="
              rounded-xl border bg-primary/5
              dark:bg-primary/10
              p-3.5 space-y-2 border-primary/20
            "
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="
                    flex size-5 items-center justify-center rounded-md
                    bg-primary/20 text-primary
                  "
                  >
                    <Sparkles className="size-3" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {t('templates.variables')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    (
                    {t('templates.variablesHint')}
                    )
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {initialTemplate.variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleInsertVariable(v)}
                    className="
                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                      bg-background border text-xs font-mono font-medium
                      text-foreground
                      hover:bg-primary hover:text-primary-foreground
                      hover:border-primary
                      transition-all duration-150 shadow-2xs group
                      cursor-pointer
                    "
                    title={t('templates.variablesHint')}
                  >
                    <span>{`{{${v}}}`}</span>
                    <Copy className="
                      size-3 opacity-50
                      group-hover:opacity-100
                      transition-opacity
                    "
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="titleInput"
              className="text-xs font-semibold text-foreground"
            >
              {t('templates.titleField')}
            </Label>
            <Input
              id="titleInput"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('templates.titlePlaceholder')}
              className="h-9 text-sm"
            />
          </div>

          {/* Body Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="bodyInput"
                className="text-xs font-semibold text-foreground"
              >
                {t('templates.bodyField')}
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {body.length}
                자
              </span>
            </div>
            <Textarea
              ref={textareaRef}
              id="bodyInput"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('templates.bodyPlaceholder')}
              rows={10}
              className="font-mono text-xs/relaxed"
            />
          </div>
        </TabsContent>

        {/* Live Preview Tab Content */}
        <TabsContent
          value="preview"
          className="flex-1 overflow-y-auto space-y-4 m-0 pr-1"
        >
          {isEmail && (
            <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
              <div className="
                border-b bg-muted/40 px-4 py-3 flex items-center justify-between
              "
              >
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-blue-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {t('templates.emailPreview')}
                  </span>
                </div>
                <Badge variant="outline" className="text-[11px] font-normal">
                  HTML / Markdown
                </Badge>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1 pb-3 border-b">
                  <span className="
                    text-[11px] text-muted-foreground uppercase tracking-wider
                    font-semibold
                  "
                  >
                    Subject
                  </span>
                  <p className="text-base font-bold text-foreground">
                    {previewTitle || '(제목 없음)'}
                  </p>
                </div>
                <div className="
                  text-sm/relaxed whitespace-pre-wrap text-foreground/90
                  font-sans
                "
                >
                  {previewBody || '(본문 내용이 없습니다)'}
                </div>
              </div>
            </div>
          )}

          {isSlack && (
            <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
              <div className="
                border-b bg-muted/40 px-4 py-3 flex items-center justify-between
              "
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {t('templates.slackPreview')}
                  </span>
                </div>
                <Badge variant="outline" className="text-[11px] font-normal">
                  Slack Block Kit
                </Badge>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="
                    size-8 rounded-md bg-emerald-600 flex items-center
                    justify-center text-white font-bold text-xs
                  "
                  >
                    AG
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground">
                      Antigravity Bot
                    </span>
                    <Badge
                      variant="secondary"
                      className="ml-1.5 text-[10px] py-0 h-4"
                    >
                      APP
                    </Badge>
                  </div>
                </div>
                <div className="
                  border-l-4 border-emerald-500 pl-3.5 py-1 space-y-1.5
                  bg-muted/20 rounded-r-lg
                "
                >
                  {previewTitle && (
                    <p className="text-sm font-bold text-foreground">
                      {previewTitle}
                    </p>
                  )}
                  <p className="
                    text-xs/relaxed whitespace-pre-wrap text-foreground/80
                    font-mono
                  "
                  >
                    {previewBody || '(메시지 내용 없음)'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isInApp && (
            <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
              <div className="
                border-b bg-muted/40 px-4 py-3 flex items-center justify-between
              "
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-purple-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {t('templates.inAppPreview')}
                  </span>
                </div>
                <Badge variant="outline" className="text-[11px] font-normal">
                  In-App Notification
                </Badge>
              </div>
              <div className="p-5">
                <div className="
                  rounded-lg border p-4 bg-muted/30 flex items-start gap-3
                "
                >
                  <div className="
                    size-8 rounded-full bg-purple-500/10 text-purple-600 flex
                    items-center justify-center shrink-0 mt-0.5
                  "
                  >
                    <Sparkles className="size-4" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {previewTitle || '새로운 알림'}
                    </p>
                    <p className="
                      text-xs/relaxed whitespace-pre-wrap text-muted-foreground
                    "
                    >
                      {previewBody || '(알림 내용 없음)'}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 pt-1">
                      방금 전
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Standard Dialog Footer */}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={updateMutation.isPending}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={updateMutation.isPending}
          className="gap-1.5"
        >
          <Check className="size-4" />
          {updateMutation.isPending ? t('common.processing') : t('common.save')}
        </Button>
      </DialogFooter>

    </>
  );
}

export function TemplateEditorDialog({
  open,
  onOpenChange,
  template,
  allTemplates,
}: TemplateEditorDialogProps) {
  const [selectedLocale, setSelectedLocale] = useState<'ko' | 'en'>('ko');
  const [testSendOpen, setTestSendOpen] = useState(false);

  const initialTemplate = template;

  const currentTemplate = useMemo(() => {
    if (!initialTemplate) return null;
    return (
      allTemplates.find(
        (t) =>
          t.code === initialTemplate.code
          && t.channel === initialTemplate.channel
          && t.locale === selectedLocale,
      ) ?? initialTemplate
    );
  }, [initialTemplate, allTemplates, selectedLocale]);

  if (!initialTemplate || !currentTemplate) return null;

  const isEmail = initialTemplate.channel === 'EMAIL';
  const isSlack = initialTemplate.channel === 'SLACK';
  const isInApp = initialTemplate.channel === 'IN_APP';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="
          sm:max-w-4xl
          max-h-[90vh] flex flex-col
        "
        >
          {/* Header */}
          <DialogHeader className="pr-8">
            <div className="
              flex flex-col gap-3
              sm:flex-row sm:items-center sm:justify-between
            "
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="
                    flex size-7 items-center justify-center rounded-lg
                    bg-primary/10 text-primary shrink-0
                  "
                  >
                    <FileEdit className="size-3.5" />
                  </div>
                  <DialogTitle className="text-base font-bold truncate">
                    {initialTemplate.name}
                  </DialogTitle>
                  <Badge variant="outline" className="font-mono text-xs">
                    {initialTemplate.code}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`
                      text-xs gap-1 font-medium border
                      ${getChannelBadgeClass(initialTemplate.channel)}
                    `}
                  >
                    {isEmail && <Mail className="size-3" />}
                    {isSlack && <MessageSquare className="size-3" />}
                    {isInApp && <Sparkles className="size-3" />}
                    {initialTemplate.channel}
                  </Badge>
                </div>
                {initialTemplate.description && (
                  <DialogDescription className="
                    text-xs text-muted-foreground truncate
                  "
                  >
                    {initialTemplate.description}
                  </DialogDescription>
                )}
              </div>

              {/* Language Selector Pills */}
              <div className="
                flex items-center gap-1 bg-muted/80 p-1 rounded-lg border
                shrink-0
              "
              >
                <Globe className="size-3.5 text-muted-foreground ml-1.5 mr-0.5" />
                <button
                  type="button"
                  onClick={() => setSelectedLocale('ko')}
                  className={`
                    px-2.5 py-1 text-xs font-semibold rounded-md transition-all
                    cursor-pointer whitespace-nowrap
                    ${
    selectedLocale === 'ko'
      ? 'bg-background text-foreground shadow-xs'
      : `
        text-muted-foreground
        hover:text-foreground
      `
    }
                  `}
                >
                  🇰🇷 한국어
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLocale('en')}
                  className={`
                    px-2.5 py-1 text-xs font-semibold rounded-md transition-all
                    cursor-pointer whitespace-nowrap
                    ${
    selectedLocale === 'en'
      ? 'bg-background text-foreground shadow-xs'
      : `
        text-muted-foreground
        hover:text-foreground
      `
    }
                  `}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Form with Standard Body & Standard Footer */}
          <TemplateEditorInnerForm
            key={`${currentTemplate.id}-${selectedLocale}`}
            currentTemplate={currentTemplate}
            initialTemplate={initialTemplate}
            onOpenChange={onOpenChange}
            onOpenTestSend={() => setTestSendOpen(true)}
          />
        </DialogContent>
      </Dialog>

      {/* Test Send Dialog */}
      <TemplateTestSendDialog
        open={testSendOpen}
        onOpenChange={setTestSendOpen}
        template={currentTemplate}
      />
    </>
  );
}
