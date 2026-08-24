import { useI18n } from '@pkg/shared/web';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useMessageTemplatesControllerTestSend } from '#/.generated/api/endpoints/message-templates/message-templates';
import type { MessageTemplateItemDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from '#/.generated/shadcn/components/ui';

interface TemplateTestSendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: MessageTemplateItemDto | null
}

export function TemplateTestSendDialog({
  open,
  onOpenChange,
  template,
}: TemplateTestSendDialogProps) {
  const { t } = useI18n();
  const [recipientEmail, setRecipientEmail] = useState('');
  const testSendMutation = useMessageTemplatesControllerTestSend();

  if (!template) return null;

  const isEmail = template.channel === 'EMAIL';
  const isSlack = template.channel === 'SLACK';
  const isInApp = template.channel === 'IN_APP';

  const handleSend = async () => {
    try {
      const res = await testSendMutation.mutateAsync({
        id: template.id,
        data: {
          recipientEmail: isEmail ? recipientEmail : undefined,
        },
      });

      if (res.success) {
        toast.success(res.message);
        onOpenChange(false);
      }
      else {
        toast.error(res.message);
      }
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('templates.sendFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
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
                {t('templates.testSend')}
              </DialogTitle>
              <DialogDescription className="text-xs">
                [
                {template.code}
                ]
                {' '}
                {template.name}
                {' '}
                (
                {template.locale.toUpperCase()}
                )
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {isEmail && (
            <div className="space-y-1.5">
              <Label htmlFor="recipientEmail" className="text-xs font-medium">
                {t('templates.recipient')}
              </Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder={t('templates.recipientPlaceholder')}
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                {t('templates.testSendDescription')}
              </p>
            </div>
          )}

          {isSlack && (
            <div className="
              rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground space-y-1
            "
            >
              <p className="font-medium text-foreground">{t('templates.slackPreview')}</p>
              <p>{t('templates.testSendDescription')}</p>
            </div>
          )}

          {isInApp && (
            <div className="
              rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground space-y-1
            "
            >
              <p className="font-medium text-foreground">{t('templates.inAppPreview')}</p>
              <p>{t('templates.testSendDescription')}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={testSendMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => {
              void handleSend();
            }}
            disabled={testSendMutation.isPending}
            className="gap-1.5"
          >
            <Send className="size-3.5" />
            {testSendMutation.isPending ? t('templates.sending') : t('templates.send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
