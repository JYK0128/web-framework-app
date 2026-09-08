import { Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useMessageTemplatesControllerTestSend } from '#/.generated/api/endpoints/message-templates/message-templates';
import type { MessageChannel, MessageTemplateItemDto, TestSendTemplateRequestDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

type TemplateTestSendDialogProps = DialogComponentProps<boolean> & {
  template: MessageTemplateItemDto
};

export function TemplateTestSendDialog({
  template,
  open,
  onOpenChange,
  close,
}: TemplateTestSendDialogProps) {
  const { t } = useI18n();

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="
              flex size-8 items-center justify-center rounded-lg bg-primary/10
              text-primary
            "
            >
              <Send className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {t('messageManagement.testSend')}
              </DialogTitle>
              <DialogDescription className="text-xs">
                [
                {template.code}
                ]
                {' '}
                {template.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <TemplateTestSendForm
          template={template}
          onSuccess={() => close?.(true)}
        />
      </DialogContent>
    </Dialog>
  );
}

function TemplateTestSendForm({
  template,
  onSuccess,
}: {
  template: MessageTemplateItemDto
  onSuccess: () => void
}) {
  const { t } = useI18n();
  const testSendMutation = useMessageTemplatesControllerTestSend();

  // 템플릿의 활성 채널 목록
  const activeChannels = useMemo(() => {
    return (template.channels ?? []).filter((c) => c.isActive);
  }, [template]);

  const [selectedChannel, setSelectedChannel] = useState<MessageChannel>(
    (activeChannels[0]?.channel as MessageChannel) ?? 'EMAIL',
  );

  const isEmail = selectedChannel === 'EMAIL';
  const isSms = selectedChannel === 'SMS';
  const isAlimtalk = selectedChannel === 'ALIMTALK';
  const isSlack = selectedChannel === 'SLACK';
  const isInApp = selectedChannel === 'IN_APP';

  const form = useAppForm({
    defaultValues: {
      recipientEmail: '',
      recipientPhone: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const payload: TestSendTemplateRequestDto = {
          channel: selectedChannel,
          recipientEmail: isEmail ? value.recipientEmail : undefined,
          recipientPhone: isSms || isAlimtalk ? value.recipientPhone : undefined,
        };

        const res = await testSendMutation.mutateAsync({
          id: template.id,
          data: payload,
        });

        if (res.success) {
          toast.success(res.message);
          onSuccess();
        }
        else {
          toast.error(res.message);
        }
      }
      catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : t('messageManagement.sendFailed'));
      }
    },
  });

  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => void form.handleSubmit()}
        className="flex flex-col gap-4 text-sm"
      >
        {/* 채널 선택 드롭다운 */}
        {activeChannels.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">발송 테스트 대상 채널</Label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value as MessageChannel)}
              className="
                h-9 w-full rounded-md border border-input bg-background px-3
                text-xs font-medium shadow-xs
                focus:outline-hidden focus:ring-1 focus:ring-ring
              "
            >
              {activeChannels.map((c) => (
                <option key={c.id || c.channel} value={c.channel}>
                  {c.channel}
                  {' '}
                  (우선순위:
                  {c.priority}
                  )
                </option>
              ))}
            </select>
          </div>
        )}

        {isEmail && (
          <form.AppField name="recipientEmail">
            {(field) => (
              <field.Input
                label={t('messageManagement.recipient')}
                placeholder={t('messageManagement.recipientPlaceholder')}
                type="email"
                description={t('messageManagement.testSendDescription')}
              />
            )}
          </form.AppField>
        )}

        {(isSms || isAlimtalk) && (
          <form.AppField name="recipientPhone">
            {(field) => (
              <field.Input
                label="수신 휴대폰 번호"
                placeholder="01012345678"
                type="tel"
                description="테스트 알림톡/문자를 수신할 휴대폰 번호를 입력하세요."
              />
            )}
          </form.AppField>
        )}

        {isSlack && (
          <div className="
            rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground
          "
          >
            <p className="font-medium text-foreground">{t('messageManagement.slackPreview')}</p>
            <p>{t('messageManagement.testSendDescription')}</p>
          </div>
        )}

        {isInApp && (
          <div className="
            rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground
          "
          >
            <p className="font-medium text-foreground">{t('messageManagement.inAppPreview')}</p>
            <p>현재 관리자 계정으로 실시간 인앱 알림이 전송됩니다.</p>
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={testSendMutation.isPending}
          >
            {t('app.dialog.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={testSendMutation.isPending}
            className="gap-1.5"
          >
            <Send className="size-3.5" />
            {testSendMutation.isPending ? t('messageManagement.sending') : t('messageManagement.send')}
          </Button>
        </DialogFooter>
      </FormLayout>
    </form.AppForm>
  );
}
