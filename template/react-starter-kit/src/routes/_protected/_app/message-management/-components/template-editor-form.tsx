import { useQueryClient } from '@tanstack/react-query';
import { Code2, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { getMessageTemplatesControllerGetMessageTemplatesQueryKey, useMessageTemplatesControllerCreateMessageTemplate, useMessageTemplatesControllerUpdateMessageTemplate } from '#/.generated/api/endpoints/message-templates/message-templates';
import type { MessageTemplateItemDto } from '#/.generated/api/model';
import { Button, DialogFooter } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';
import { TEMPLATE_CHANNEL_OPTIONS } from '#/routes/_protected/_app/message-management/-configs/template-form.config';

interface TemplateEditorFormProps {
  template: MessageTemplateItemDto | null
  onSuccess: () => void
  onOpenTestSend?: () => void
}

export function TemplateEditorForm({
  template,
  onSuccess,
  onOpenTestSend,
}: TemplateEditorFormProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const createMutation = useMessageTemplatesControllerCreateMessageTemplate();
  const updateMutation = useMessageTemplatesControllerUpdateMessageTemplate();

  const isEditing = Boolean(template);
  const isPending = createMutation.isPending || updateMutation.isPending;
  let submitText = isEditing ? t('messageManagement.save') : t('messageManagement.create');
  if (isPending) {
    submitText = t('messageManagement.processing');
  }

  const form = useAppForm({
    defaultValues: {
      channel: template?.channel ?? 'EMAIL',
      code: template?.code ?? '',
      name: template?.name ?? '',
      title: template?.title ?? '',
      body: template?.body ?? '',
      variablesInput: template?.variables?.join(', ') ?? 'userName, appName',
      description: template?.description ?? '',
      isActive: template?.isActive ?? true,
    },
    onSubmit: async ({ value }) => {
      try {
        if (template) {
          await updateMutation.mutateAsync({
            id: template.id,
            data: {
              code: value.code.trim().toUpperCase(),
              channel: value.channel,
              name: value.name.trim(),
              title: value.title.trim() || null,
              body: value.body,
              variables: value.variablesInput.split(',').map((item) => item.trim()).filter(Boolean),
              description: value.description.trim() || null,
              isActive: value.isActive,
            },
          });
          toast.success(t('messageManagement.saveSuccess'));
        }
        else {
          const code = value.code.trim().toUpperCase();
          const name = value.name.trim();
          const body = value.body.trim();

          if (!code || !name || !body) {
            toast.error('템플릿 코드, 명칭, 본문을 입력해주세요.');
            return;
          }

          await createMutation.mutateAsync({
            data: {
              channel: value.channel,
              code,
              name,
              title: value.title.trim() || null,
              body: value.body,
              variables: value.variablesInput.split(',').map((item) => item.trim()).filter(Boolean),
              description: value.description.trim() || null,
              isActive: value.isActive,
            },
          });
          toast.success(t('messageManagement.createSuccess'));
        }

        await queryClient.invalidateQueries({
          queryKey: getMessageTemplatesControllerGetMessageTemplatesQueryKey(),
        });
        onSuccess();
      }
      catch {
        toast.error(template ? t('messageManagement.saveFailed') : t('messageManagement.createFailed'));
      }
    },
  });

  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => void form.handleSubmit()}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4">
          <form.AppField name="channel">
            {(field) => <field.Select label={t('messageManagement.channelField')} options={TEMPLATE_CHANNEL_OPTIONS} placeholder={t('messageManagement.channelPlaceholder')} required />}
          </form.AppField>
        </div>

        {template && template.variables.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-primary" />
              <span className="text-xs font-semibold">{t('messageManagement.variables')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {template.variables.map((variable) => (
                <span
                  key={variable}
                  className="
                    inline-flex items-center gap-1 rounded-lg border font-mono
                    text-xs
                  "
                >
                  <Code2 className="size-3" />
                  {'{{' + variable + '}}'}
                </span>
              ))}
            </div>
          </div>
        )}

        {template && onOpenTestSend && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onOpenTestSend}>
              <Send className="size-3.5" />
              {t('messageManagement.testSend')}
            </Button>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          <form.AppField name="code">
            {(field) => (
              <field.Input
                label={t('messageManagement.codeField')}
                placeholder={t('messageManagement.codePlaceholder')}
                className="font-mono"
                required
                onChange={(event) => field.handleChange(event.target.value.toUpperCase())}
              />
            )}
          </form.AppField>
          <form.AppField name="name">
            {(field) => <field.Input label={t('messageManagement.nameField')} placeholder={t('messageManagement.namePlaceholder')} required />}
          </form.AppField>
        </div>

        <form.AppField name="title">
          {(field) => <field.Input label={t('messageManagement.titleField')} placeholder={t('messageManagement.titlePlaceholder')} />}
        </form.AppField>

        <form.AppField name="variablesInput">
          {(field) => (
            <field.Input
              label={t('messageManagement.variablesInput')}
              placeholder={t('messageManagement.variablesInputPlaceholder')}
              className="font-mono"
            />
          )}
        </form.AppField>

        <form.AppField name="body">
          {(field) => (
            <field.Textarea
              label={t('messageManagement.bodyField')}
              placeholder={t('messageManagement.bodyPlaceholder')}
              rows={6}
              className="font-mono leading-relaxed"
              required
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => <field.Input label={t('messageManagement.descriptionField')} placeholder={t('messageManagement.descriptionPlaceholder')} />}
        </form.AppField>

        <div className="flex items-center justify-between border-t">
          <form.AppField name="isActive">
            {(field) => <field.Switch label={t('messageManagement.isActiveField')} orientation="horizontal" />}
          </form.AppField>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isPending}>
            {t('app.dialog.cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {submitText}
          </Button>
        </DialogFooter>
      </FormLayout>
    </form.AppForm>
  );
}
