import { Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { valueIf } from '@pkg/shared/common';

import { useMessageTemplatesControllerTestSend } from '#/.generated/api/endpoints/message-templates/message-templates';
import type { MessageTemplateItemDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/app';
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
      <DialogContent className="">
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

  const isEmail = template.channel === 'EMAIL';
  const isSlack = template.channel === 'SLACK';
  const isInApp = template.channel === 'IN_APP';

  const form = useAppForm({
    defaultValues: {
      recipientEmail: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const res = await testSendMutation.mutateAsync({
          id: template.id,
          data: {
            recipientEmail: valueIf(isEmail, value.recipientEmail),
          },
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
        toast.error(err instanceof Error ? err.message : t('templates.sendFailed'));
      }
    },
  });

  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => void form.handleSubmit()}
        className="flex flex-col gap-4 text-sm"
      >
        {isEmail && (
          <form.AppField name="recipientEmail">
            {(field) => (
              <field.Input
                label={t('templates.recipient')}
                placeholder={t('templates.recipientPlaceholder')}
                type="email"
                description={t('templates.testSendDescription')}
              />
            )}
          </form.AppField>
        )}

        {isSlack && (
          <div className="rounded-lg bg-muted/60 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{t('templates.slackPreview')}</p>
            <p>{t('templates.testSendDescription')}</p>
          </div>
        )}

        {isInApp && (
          <div className="rounded-lg bg-muted/60 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{t('templates.inAppPreview')}</p>
            <p>{t('templates.testSendDescription')}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={testSendMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={testSendMutation.isPending}
            className="gap-1.5"
          >
            <Send className="size-3.5" />
            {testSendMutation.isPending ? t('templates.sending') : t('templates.send')}
          </Button>
        </DialogFooter>
      </FormLayout>
    </form.AppForm>
  );
}
