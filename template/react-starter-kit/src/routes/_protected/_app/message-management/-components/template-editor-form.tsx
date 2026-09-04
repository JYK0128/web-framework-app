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
  let submitText = isEditing ? t('common.save') : t('templates.create');
  if (isPending) {
    submitText = t('common.processing');
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
          toast.success(t('templates.saveSuccess'));
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
          toast.success(t('templates.createSuccess'));
        }

        await queryClient.invalidateQueries({
          queryKey: getMessageTemplatesControllerGetMessageTemplatesQueryKey(),
        });
        onSuccess();
      }
      catch {
        toast.error(template ? t('templates.saveFailed') : t('templates.createFailed'));
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
            {(field) => <field.Select label={t('templates.channelField')} options={TEMPLATE_CHANNEL_OPTIONS} placeholder={t('templates.channelPlaceholder')} required />}
          </form.AppField>
        </div>

        {template && template.variables.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-primary" />
              <span className="text-xs font-semibold">{t('templates.variables')}</span>
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
              {t('templates.testSend')}
            </Button>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          <form.AppField name="code">
            {(field) => (
              <field.Input
                label={t('templates.codeField')}
                placeholder={t('templates.codePlaceholder')}
                className="font-mono"
                required
                onChange={(event) => field.handleChange(event.target.value.toUpperCase())}
              />
            )}
          </form.AppField>
          <form.AppField name="name">
            {(field) => <field.Input label={t('templates.nameField')} placeholder={t('templates.namePlaceholder')} required />}
          </form.AppField>
        </div>

        <form.AppField name="title">
          {(field) => <field.Input label={t('templates.titleField')} placeholder={t('templates.titlePlaceholder')} />}
        </form.AppField>

        <form.AppField name="variablesInput">
          {(field) => (
            <field.Input
              label={t('templates.variablesInput')}
              placeholder={t('templates.variablesInputPlaceholder')}
              className="font-mono"
            />
          )}
        </form.AppField>

        <form.AppField name="body">
          {(field) => (
            <field.Textarea
              label={t('templates.bodyField')}
              placeholder={t('templates.bodyPlaceholder')}
              rows={6}
              className="font-mono leading-relaxed"
              required
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => <field.Input label={t('templates.descriptionField')} placeholder={t('templates.descriptionPlaceholder')} />}
        </form.AppField>

        <div className="flex items-center justify-between border-t">
          <form.AppField name="isActive">
            {(field) => <field.Switch label={t('templates.isActiveField')} orientation="horizontal" />}
          </form.AppField>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {submitText}
          </Button>
        </DialogFooter>
      </FormLayout>
    </form.AppForm>
  );
}
